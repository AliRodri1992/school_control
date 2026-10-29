# Verify the opt-in development dataset after seeding twice in CI.
raise "Demo verification runs in development only" unless Rails.env.development?

start_year = Date.current.month >= 8 ? Date.current.year : Date.current.year - 1
year = AcademicYear.find_by!(name: "#{start_year}–#{start_year + 1}")
groups = year.groups.where(grade_level: 1..6, section: %w[A B])
raise "Expected 12 school groups; found #{groups.count}" unless groups.count == 12

groups.each do |group|
  total = group.enrollments.count
  raise "Group #{group.label} contains only #{total} enrollments" if total < 10
end

minimums = {
  "Students" => Student.count,
  "Guardians and staff" => User.count,
  "Subjects" => Subject.count,
  "Courses" => Course.count,
  "Enrollment records" => Enrollment.where(academic_year: year).count,
  "Family contacts" => StudentContact.count,
  "Grades" => Grade.count,
  "Attendance records" => Attendance.count,
  "Assignments" => Assignment.count,
  "Classroom submissions" => AssignmentSubmission.count,
  "Student documents" => StudentDocument.count,
  "Announcements" => Announcement.count,
  "Messages" => InstitutionalMessage.count,
  "Calendar events" => CalendarEvent.count
}
minimums.each do |name, count|
  raise "Expected at least 30 #{name}, found #{count}" if count < 30
end
puts "Demo verified: 12 groups with at least 10 pupils each."
minimums.each { |name, count| puts "  #{name}: #{count}" }
