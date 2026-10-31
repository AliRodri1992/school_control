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
# Existing installations may have an administrator role created before newer permissions.
AccessRole.assign_default!(admin)
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
  require_relative "demo_academics"
  DemoAcademics::CORE_SUBJECTS.each do |code, (name, _)|
    Subject.find_or_create_by!(code: code) { |record| record.name = name }
  end
  (1..6).each do |grade|
    %w[A B].each do |section|
      group = Group.find_or_create_by!(academic_year: year, grade_level: grade, section: section)
      email = grade == 1 && section == "A" ? "docente@school.test" : "docente.#{grade}#{section.downcase}@school.test"
      teacher = User.find_or_create_by!(email: email) { |record| record.assign_attributes(name: "Docente #{grade}#{section}", role: "teacher", password: password) }
      Subject.where(code: DemoAcademics::CORE_SUBJECTS.keys).find_each do |subject|
        Course.find_or_create_by!(group: group, subject: subject) do |record|
          record.assign_attributes(teacher: teacher,
            weekly_periods: DemoAcademics::CORE_SUBJECTS.fetch(subject.code).last)
        end
      end
    end
  end
  student = Student.find_or_create_by!(curp: "DEMO200101HDFRNN01") do |record|
    record.assign_attributes(first_name: "Alex", last_name: "Ejemplo", birth_date: Date.new(2020, 1, 1), guardian: guardian, user: learner)
  end
  admission = Admission.find_or_create_by!(student: student, academic_year: year) { |record| record.assign_attributes(grade_level: 1, kind: "new") }
  # Aspirante de primer ingreso: no crear matrícula antes de aprobar su solicitud.
  applicant = Student.find_or_create_by!(curp: "DEMO200205MDFRNN02") do |record|
    record.assign_attributes(first_name: "Sofía", last_name: "Ejemplo", birth_date: Date.new(2020, 2, 5),
      guardian: guardian, emergency_phone: "+525555000002")
  end
  applicant.addresses.find_or_create_by!(purpose: "home", line1: "Calle Escuela 15") do |address|
    address.assign_attributes(country_code: "MX", locality: "Ciudad de México", region: "Ciudad de México",
      postal_code: "06000", primary: true)
  end
  applicant.phone_numbers.find_or_create_by!(purpose: "emergency", number_e164: "+525555000002") do |phone|
    phone.assign_attributes(country_code: "MX", primary: true)
  end
  applicant.contacts.find_or_create_by!(name: "Familia de ejemplo", relationship: "Tutor") do |contact|
    contact.assign_attributes(primary: true, emergency: true, pickup_authorized: true)
  end
  Admission.find_or_create_by!(student: applicant, academic_year: year) do |record|
    record.assign_attributes(kind: "new", grade_level: 1)
  end
  group = year.groups.find_by!(grade_level: 1, section: "A")
  if admission.status == "submitted"
    student.addresses.find_or_create_by!(country_code: "MX", purpose: "home", line1: "Calle Aula 12")
    student.phone_numbers.find_or_create_by!(number_e164: "+525555000001", purpose: "emergency")
    student.contacts.find_or_create_by!(name: "Familia de ejemplo", relationship: "Tutor")
    admission.update!(status: "approved")
  end
  AdmitStudent.call(admission: admission, group: group, actor: admin) if admission.status == "approved" && !admission.enrollment
  GenerateSchedule.call(group: group) unless ScheduleSlot.joins(:course).where(courses: { group_id: group.id }).exists?
  Announcement.find_or_create_by!(title: "Bienvenidos a nuestra comunidad") { |record| record.body = "Consulta tus horarios, conoce las próximas actividades y acompaña cada paso del aprendizaje." }
  CalendarEvent.find_or_create_by!(academic_year: year, title: "Reunión de bienvenida") do |record|
    record.starts_at = 7.days.from_now.change(hour: 9)
    record.ends_at = 7.days.from_now.change(hour: 10)
    record.kind = "meeting"
    record.description = "Presentación del ciclo escolar y encuentro con las familias."
  end
  require_relative "demo_admissions"
  DemoAdmissions.seed!(year: year, guardian: guardian, admin: admin)
  require_relative "demo_modules"
  DemoModules.seed!(year: year, guardian: guardian, admin: admin, learner: learner, student: student)
  require_relative "demo_bulk"
  DemoBulk.seed!(year: year, admin: admin, password: password)
  DemoAcademics.seed!(year: year, admin: admin)
  puts "Datos ficticios preparados sin duplicar registros."
end

EmailTemplate.activity.save! unless EmailTemplate.exists?(key: "activity", locale: "es")
{
  "welcome" => [ "Bienvenido a nuestra comunidad", "¡Qué gusto tenerte aquí!", "Tu cuenta escolar está lista. Inicia sesión para conocer los recursos de tu portal." ],
  "admission_update" => [ "Actualización de tu solicitud", "Tu trámite escolar tiene novedades", "Ingresa al portal para consultar el estado actualizado de tu solicitud." ],
  "attendance_alert" => [ "Aviso de asistencia", "Seguimiento de asistencia", "Hay información nueva relacionada con la asistencia. Consulta tu portal para conocer los detalles." ],
  "grade_published" => [ "Nuevas calificaciones disponibles", "Consulta los avances académicos", "Las evaluaciones publicadas están disponibles en el portal escolar." ],
  "document_review" => [ "Revisión de documentos", "Revisa tus documentos", "Tu expediente tiene una actualización documental. Consulta el portal para revisar los detalles." ]
}.each do |key, (subject, heading, body)|
  EmailTemplate.find_or_create_by!(key: key, locale: "es") do |template|
    template.assign_attributes(subject: subject, heading: heading, body: body,
      footer: "Este mensaje fue enviado por tu comunidad escolar.", accent_color: "#405CF5", status: "draft")
  end
end


# Language catalog is repeatable and does not replace any reviewed translations.
Language.find_or_create_by!(code: "es") do |language|
  language.assign_attributes(name: "Español (México)", native_name: "Español", status: "active")
end
Language.find_or_create_by!(code: "en") do |language|
  language.assign_attributes(name: "Inglés", native_name: "English", status: "active")
end

# Reviewed core shell translations. Future languages use the draft/publish workflow.
[
  [ "shell.portal", "Portal", "Portal" ],
  [ "shell.search_modules", "Buscar módulo…", "Search module…" ],
  [ "shell.notifications", "Notificaciones", "Notifications" ],
  [ "shell.no_notifications", "No hay notificaciones recientes.", "No recent notifications." ],
  [ "shell.view_all", "Ver todas las notificaciones", "View all notifications" ],
  [ "shell.profile", "Mi perfil y seguridad", "My profile and security" ],
  [ "shell.signout", "Cerrar sesión", "Sign out" ],
  [ "shell.locale", "Idioma", "Language" ],
  [ "shell.help", "Inicio y ayuda", "Home and help" ],
  [ "shell.current", "Inicio", "Home" ],
  [ "nav.dashboard", "Dashboard", "Dashboard" ],
  [ "nav.students", "Alumnos y expedientes", "Students and records" ],
  [ "nav.tutors.students", "Aspirantes y mis hijos", "Applicants and my children" ],
  [ "nav.student_contacts", "Contactos familiares", "Family contacts" ],
  [ "nav.documents", "Documentos", "Documents" ],
  [ "nav.admissions", "Admisiones", "Admissions" ],
  [ "nav.enrollments", "Matrícula y trayectoria", "Enrollment and records" ],
  [ "nav.academic_years", "Ciclos escolares", "School years" ],
  [ "nav.groups", "Grupos", "Groups" ],
  [ "nav.courses", "Clases", "Classes" ],
  [ "nav.subjects", "Materias", "Subjects" ],
  [ "nav.schedule", "Horarios", "Schedules" ],
  [ "nav.attendances", "Asistencia", "Attendance" ],
  [ "nav.grades", "Calificaciones", "Grades" ],
  [ "nav.classroom", "Aula virtual", "Virtual classroom" ],
  [ "nav.messages", "Mensajes", "Messages" ],
  [ "nav.announcements", "Comunicados", "Announcements" ],
  [ "nav.calendar_events", "Calendario", "Calendar" ],
  [ "nav.reports", "Reportes", "Reports" ],
  [ "nav.imports", "Importaciones", "Imports" ],
  [ "nav.users", "Usuarios", "Users" ],
  [ "nav.access_roles", "Roles y permisos", "Roles and permissions" ],
  [ "nav.school", "Mi escuela", "My school" ],
  [ "nav.email_templates", "Plantillas de correo", "Email templates" ],
  [ "nav.languages", "Idiomas y traducciones", "Languages and translations" ],
  [ "nav.profile", "Mi perfil", "My profile" ]
].each do |key, es, en|
  { "es" => es, "en" => en }.each do |locale, translated|
    language = Language.find_by!(code: locale)
    TranslationEntry.find_or_create_by!(language: language, key: key) do |entry|
      entry.assign_attributes(text: translated, status: "published", reviewer: admin, published_at: Time.current)
    end
  end
end


# Published role-aware UI translations. Existing manually reviewed values are retained.
[
  [ "portal.hello", "Hola", "Hello" ],
  [ "portal.shortcuts", "Accesos rápidos", "Quick access" ],
  [ "portal.shortcuts_hint", "Herramientas disponibles de acuerdo con tus permisos.", "Available tools depend on your permissions." ],
  [ "portal.family.title", "Seguimiento familiar", "Family progress" ],
  [ "portal.family.select", "Elige un hijo para filtrar su información.", "Choose a child to view their information." ],
  [ "portal.admin.eyebrow", "DIRECCIÓN · VISIÓN INSTITUCIONAL", "ADMINISTRATION · SCHOOL OVERVIEW" ],
  [ "portal.admin.headline", "Cada decisión, una escuela mejor.", "Every decision makes a better school." ],
  [ "portal.admin.intro", "Organiza trámites, alumnos y procesos con indicadores de tu institución.", "Manage school processes and student records in one place." ],
  [ "portal.teacher.eyebrow", "DOCENTES · MI JORNADA", "TEACHERS · MY DAY" ],
  [ "portal.teacher.headline", "Cada clase cuenta. Cada alumno también.", "Every class counts. Every student matters." ],
  [ "portal.teacher.intro", "Prepara tus clases, registra asistencia y acompaña el aprendizaje.", "Plan classes, record attendance and support learning." ],
  [ "portal.student.eyebrow", "ALUMNOS · MI APRENDIZAJE", "STUDENTS · MY LEARNING" ],
  [ "portal.student.headline", "¡Hoy es un buen día para aprender!", "Today is a great day to learn!" ],
  [ "portal.student.intro", "Encuentra tus tareas, horario y avances de manera sencilla.", "See your assignments, schedule and progress." ],
  [ "portal.guardian.eyebrow", "FAMILIAS · SEGUIMIENTO", "FAMILIES · PROGRESS" ],
  [ "portal.guardian.headline", "Más cerca de cada paso de tus hijos.", "Stay close to every step of your children's journey." ],
  [ "portal.guardian.intro", "Acompaña su trayectoria escolar y realiza los trámites en un solo lugar.", "Follow progress and manage school applications in one place." ],
  [ "help.title", "Guía de uso del sistema", "System user guide" ],
  [ "help.description", "Aprende paso a paso a utilizar los módulos disponibles en tu portal. Las instrucciones se adaptan a tus permisos.", "Learn to use each portal module step by step. Topics adapt to your permissions." ],
  [ "help.search", "Buscar tarea o módulo…", "Search task or module…" ],
  [ "help.open", "Ir al módulo", "Open module" ]
].each do |key, es, en|
  { "es" => es, "en" => en }.each do |code, translated|
    language = Language.find_by!(code: code)
    TranslationEntry.find_or_create_by!(language: language, key: key) do |entry|
      entry.assign_attributes(text: translated, status: "published", reviewer: admin, published_at: Time.current)
    end
  end
end
