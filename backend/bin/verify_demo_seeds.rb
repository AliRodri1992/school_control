# Verify the opt-in development dataset after seeding twice in CI.
raise "Demo verification runs in development only" unless Rails.env.development?

require_relative "../db/demo_academics"

start_year = Date.current.month >= 8 ? Date.current.year : Date.current.year - 1
year = AcademicYear.find_by!(name: "#{start_year}–#{start_year + 1}")
raise "Current academic year requires three configured evaluation periods" unless year.evaluation_periods.all? { |period| period[:starts_on] && period[:ends_on] }
expected_status = if Date.current < year.starts_on
  "draft"
elsif Date.current >= year.ends_on
  "closing"
else
  "active"
end
raise "Current cycle must be #{expected_status}, got #{year.status}" unless year.status == expected_status
upcoming = AcademicYear.find_by!(name: "#{start_year + 1}–#{start_year + 2}")
raise "Future cycle must remain in preparation" unless upcoming.status == "draft"
raise "Future cycle must have three terms" unless upcoming.evaluation_periods.all? { |part| part[:starts_on] && part[:ends_on] }
raise "Future application periods must precede class start" unless upcoming.admissions_open_on < upcoming.starts_on
raise "Future applicants must remain in draft" unless upcoming.admissions.where(status: "draft").exists?
raise "Only one active cycle is permitted" if AcademicYear.where(status: "active").count > 1

raise "All capture and report dates must be configured" unless AcademicYear.where(id: [year.id, upcoming.id]).all? do |cycle|
  AcademicYear::EVALUATION_PERIODS.all? do |term|
    %w[capture_opens_on capture_closes_on review_on reports_on].all? do |suffix|
      cycle.public_send("#{term}_term_#{suffix}").present?
    end
  end
end
raise "The demo calendar needs suspension, CTE and vacations" unless
  %w[suspension cte vacation].all? { |kind| year.calendar_events.where(kind: kind, all_day: true).exists? }

histories = AcademicYear.where("name LIKE ?", "Demo histórico %")
raise "Missing historical years" if histories.count < 5
histories.each do |cycle|
  raise "History #{cycle.name} needs 3 trimesters" unless cycle.evaluation_periods.all? { |part| part[:starts_on] && part[:ends_on] }
  raise "History #{cycle.name} was not closed" unless %w[closed archived].include?(cycle.status)
  raise "Missing lifecycle audit for #{cycle.name}" if cycle.status_transitions.none?
end
archived = AcademicYear.find_by!(name: "Demo archivado #{start_year - 7}–#{start_year - 6}")
raise "Archived demo cycle is not archived" unless archived.status == "archived"
raise "Archived demo cycle lacks transition history" unless archived.status_transitions.count == 4
raise "The current cycle must have a lifecycle transition" if year.status != "draft" && year.status_transitions.none?
groups = year.groups.where(grade_level: 1..6, section: %w[A B])
raise "Expected 12 school groups; found #{groups.count}" unless groups.count == 12

groups.each do |group|
  total = group.enrollments.count
  raise "Group #{group.label} contains only #{total} enrollments" if total < 10

  core = group.courses.joins(:subject).where(subjects: { code: DemoAcademics::CORE_SUBJECTS.keys })
  raise "Group #{group.label} is missing core subjects" unless core.count == DemoAcademics::CORE_SUBJECTS.size

  core.includes(:schedule_slots).each do |course|
    count = course.schedule_slots.size
    raise "Course #{course.label} has #{count} of #{course.weekly_periods} weekly slots" unless count == course.weekly_periods
  end

  active = group.enrollments.where(status: "active")
  active.find_each do |enrollment|
    grades = enrollment.grades.joins(:course).where(courses: { group_id: group.id })
    raise "Enrollment #{enrollment.id} needs more subject grades" if grades.count < DemoAcademics::CORE_SUBJECTS.size
    raise "Enrollment #{enrollment.id} needs 12 field/term evaluations" unless enrollment.formative_evaluations.count == 12
    expected_days = DemoAcademics.school_days(year).length
    actual_days = enrollment.attendances.where(on: DemoAcademics.school_days(year)).count
    raise "Enrollment #{enrollment.id} is missing attendance history" if actual_days < expected_days
  end
end

minimums = {
  "Students" => Student.count,
  "Guardians and staff" => User.count,
  "Subjects" => Subject.count,
  "Courses" => Course.count,
  "Enrollment records" => Enrollment.where(academic_year: year).count,
  "Family contacts" => StudentContact.count,
  "Grades" => Grade.count,
  "Weekly schedule slots" => ScheduleSlot.joins(course: :group).where(groups: { academic_year_id: year.id }).count,
  "Academic notes" => Note.where(category: "seguimiento", visibility: "internal").count,
  "Attendance records" => Attendance.count,
  "Assignments" => Assignment.count,
  "Classroom submissions" => AssignmentSubmission.count,
  "Student documents" => StudentDocument.count,
  "Import batches" => DataImport.count,
  "Ready report exports" => ReportExport.where(status: "ready").count,
  "Announcements" => Announcement.count,
  "Messages" => InstitutionalMessage.count,
  "Calendar events" => CalendarEvent.count
}
minimums.each do |name, count|
  raise "Expected at least 30 #{name}, found #{count}" if count < 30
end
raise "Expected 10 core subjects" unless Subject.where(code: DemoAcademics::CORE_SUBJECTS.keys).count == 10
raise "Expected at least 1,200 evaluations" if Grade.joins(course: :group).where(groups: { academic_year_id: year.id }).count < 1_200
raise "Expected at least 12 attendance days per enrolled pupil" if
  DemoAcademics.school_days(year).length >= 12 && Attendance.joins(enrollment: :group)
    .where(groups: { academic_year_id: year.id }).count < 1_440
# A sixth-grader's history must contain courses and all three terms for every prior grade.
historical = Enrollment.joins(:academic_year)
  .where("academic_years.name LIKE ?", "Demo histórico %")
  .where(status: "completed")
historical_counts = Grade.where(enrollment_id: historical.select(:id)).group(:enrollment_id).count
historical.find_each do |enrollment|
  count = historical_counts.fetch(enrollment.id, 0)
  raise "Incomplete #{enrollment.group.label} history for student #{enrollment.student_id}: #{count}/30 marks" if count < 30
  raise "Missing formative evaluations for historical enrollment #{enrollment.id}" unless enrollment.formative_evaluations.published.count == 12
  raise "Historical field marks must be integer" unless enrollment.formative_evaluations.published.all? do |mark|
    mark.score.frac.zero? && mark.score >= (enrollment.group.grade_level <= 2 ? 6 : 5)
  end
end
year.groups.where(grade_level: 6, section: %w[A B]).each do |group|
  group.enrollments.find_each do |enrollment|
    prior = Enrollment.where(student_id: enrollment.student_id, status: "completed")
      .joins(:academic_year).where("academic_years.name LIKE ?", "Demo histórico %")
      .joins(:group).order("groups.grade_level")
    raise "Sixth grader #{enrollment.student_id} needs five previous grades" unless prior.count == 5
    raise "Incomplete grade progression for #{enrollment.student_id}" unless prior.map { |entry| entry.group.grade_level } == (1..5).to_a
  end
end
# No attendance is recorded on explicitly designated non-school days.
blocked_dates = year.calendar_events.where(kind: %w[holiday vacation suspension cte], all_day: true)
  .flat_map { |event| (event.starts_at.to_date...event.ends_at.to_date).to_a }.uniq
raise "Attendance exists on a suspended school day" if Attendance.joins(:enrollment)
  .where(enrollments: { academic_year_id: year.id }, on: blocked_dates).exists?

puts "Demo verified: 12 groups with at least 10 pupils each."
puts "  Cycle statuses: #{year.name}=#{year.status}, #{upcoming.name}=#{upcoming.status}, archived=#{archived.status}"
puts "  Historical grade records: #{historical_counts.values.sum} in #{historical.count} prior enrollments"
minimums.each { |name, count| puts "  #{name}: #{count}" }
