# Verify the opt-in development dataset after seeding twice in CI.
raise "Demo verification runs in development only" unless Rails.env.development?

require_relative "../db/demo_academics"

start_year = Date.current.month >= 8 ? Date.current.year : Date.current.year - 1
year = AcademicYear.find_by!(name: "#{start_year}–#{start_year + 1}")
raise "Current academic year requires three configured evaluation periods" unless year.evaluation_periods.all? { |period| period[:starts_on] && period[:ends_on] }
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
puts "Demo verified: 12 groups with at least 10 pupils each."
puts "  Historical grade records: #{historical_counts.values.sum} in #{historical.count} prior enrollments"
minimums.each { |name, count| puts "  #{name}: #{count}" }
