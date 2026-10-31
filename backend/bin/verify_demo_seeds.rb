# Verify the opt-in development dataset after seeding twice in CI.
raise "Demo verification runs in development only" unless Rails.env.development?

require_relative "../db/demo_academics"

start_year = Date.current.month >= 8 ? Date.current.year : Date.current.year - 1
year = AcademicYear.find_by!(name: "#{start_year}–#{start_year + 1}")
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
puts "Demo verified: 12 groups with at least 10 pupils each."
minimums.each { |name, count| puts "  #{name}: #{count}" }
