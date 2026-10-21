# Test records are created by factories, without administrator credentials.
return if Rails.env.test?

school = School.first_or_create!(name: ENV.fetch("SCHOOL_NAME", "Primaria · Aula"))
admin = User.find_or_initialize_by(email: ENV.fetch("ADMIN_EMAIL", "admin@school.test"))
if admin.new_record?
  admin.name = "Administración escolar"
  admin.role = "admin"
  admin.password = ENV.fetch("ADMIN_PASSWORD")
  admin.save!
end
puts "Escuela y administrador disponibles."

if ENV["DEMO_SEEDS"] == "true"
  raise "Las semillas demo solo se permiten en desarrollo" unless Rails.env.development?
  password = ENV.fetch("DEMO_PASSWORD")
  start_year = Date.current.month >= 8 ? Date.current.year : Date.current.year - 1
  year = AcademicYear.find_or_create_by!(name: "#{start_year}–#{start_year + 1}") do |record|
    record.starts_on = Date.new(start_year, 8, 24)
    record.ends_on = Date.new(start_year + 1, 7, 16)
    record.admissions_open_on = Date.current - 30
    record.admissions_close_on = Date.current + 60
    record.reenrollment_open_on = Date.current - 30
    record.reenrollment_close_on = Date.current + 60
  end
  guardian = User.find_or_create_by!(email: "familia@school.test") { |record| record.assign_attributes(name: "Familia de ejemplo", role: "guardian", password: password) }
  learner = User.find_or_create_by!(email: "alumno@school.test") { |record| record.assign_attributes(name: "Alex Ejemplo", role: "student", password: password) }
  subjects = { "ESP" => "Español", "MAT" => "Matemáticas", "CIE" => "Ciencias naturales", "HIS" => "Historia", "GEO" => "Geografía", "ART" => "Artes", "EDF" => "Educación física" }
  subjects.each { |code, name| Subject.find_or_create_by!(code: code) { |record| record.name = name } }
  (1..6).each do |grade|
    %w[A B].each do |section|
      group = Group.find_or_create_by!(academic_year: year, grade_level: grade, section: section)
      email = grade == 1 && section == "A" ? "docente@school.test" : "docente.#{grade}#{section.downcase}@school.test"
      teacher = User.find_or_create_by!(email: email) { |record| record.assign_attributes(name: "Docente #{grade}#{section}", role: "teacher", password: password) }
      Subject.find_each { |subject| Course.find_or_create_by!(group: group, subject: subject) { |record| record.assign_attributes(teacher: teacher, weekly_periods: 3) } }
    end
  end
  student = Student.find_or_create_by!(curp: "DEMO200101HDFRNN01") do |record|
    record.assign_attributes(first_name: "Alex", last_name: "Ejemplo", birth_date: Date.new(2020, 1, 1), guardian: guardian, user: learner)
  end
  admission = Admission.find_or_create_by!(student: student, academic_year: year) { |record| record.assign_attributes(grade_level: 1, kind: "new") }
  group = year.groups.find_by!(grade_level: 1, section: "A")
  AdmitStudent.call(admission: admission, group: group, actor: admin) if admission.status == "submitted"
  GenerateSchedule.call(group: group) unless ScheduleSlot.joins(:course).where(courses: { group_id: group.id }).exists?
  Announcement.find_or_create_by!(title: "Bienvenidos a nuestra comunidad") { |record| record.body = "Consulta tus horarios, conoce las próximas actividades y acompaña cada paso del aprendizaje." }
  CalendarEvent.find_or_create_by!(academic_year: year, title: "Reunión de bienvenida") do |record|
    record.starts_at = 7.days.from_now.change(hour: 9)
    record.ends_at = 7.days.from_now.change(hour: 10)
    record.kind = "meeting"
    record.description = "Presentación del ciclo escolar y encuentro con las familias."
  end
  puts "Datos ficticios preparados sin duplicar registros."
end
