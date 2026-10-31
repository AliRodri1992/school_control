# Development-only, deterministic school-wide dataset.
# Creates students and their genuine promotion history instead of bypassing enrollment validation.
require_relative "demo_family_identities"
require_relative "demo_school_cycles"

module DemoBulk
  FIRST_NAMES = %w[Ana Luis Sofia Mateo Elisa Diego Carla Pablo Irene Hugo Julia Bruno Lucia Tomas Elena Ivan].freeze
  LAST_NAMES = %w[Rivera Flores Luna Ortiz Torres Ruiz Perez Soto Vargas Mora Salas Rojas Castro Diaz].freeze
  TARGET_PER_GROUP = 10
  MIN_RECORDS = 30

  def self.seed!(year:, admin:, password:)
    raise "Demo dataset is development-only" unless Rails.env.development?
    guardians = seed_guardians(password)
    seed_subjects
    groups = year.groups.where(grade_level: 1..6, section: %w[A B]).order(:grade_level, :section).to_a
    raise "Expected 12 class groups" unless groups.size == 12

    students = []
    groups.each_with_index do |group, group_index|
      group.update!(capacity: TARGET_PER_GROUP + 10) if group.capacity < TARGET_PER_GROUP
      TARGET_PER_GROUP.times do |index|
        break if group.enrollments.count >= TARGET_PER_GROUP
        serial = group_index * 20 + index + 1
        guardian = guardians[(serial - 1) % guardians.length]
        birth = Date.new(year.starts_on.year - 5 - group.grade_level, 1, 1) + serial.days
        curp = "DEMO#{birth.strftime('%y%m%d')}HDFRNN#{serial % 10}#{serial % 10}"
        student = Student.find_or_create_by!(curp: curp) do |record|
          record.assign_attributes(first_name: FIRST_NAMES[serial % FIRST_NAMES.length],
            last_name: LAST_NAMES[serial % LAST_NAMES.length], birth_date: birth, guardian: guardian,
            nationality: "MX", emergency_phone: "+525555#{format('%06d', serial)}")
        end
        populate_identity(student, guardian, serial)
        ensure_progression(student, group, year, admin)
        students << student
      end
    end

    seed_classroom(year, students)
    seed_communications(year, admin, guardians)
    seed_calendar(year)
    seed_documents(students, guardians)
    seed_imports(admin)
    seed_reports(year, admin)
    puts "Demo escolar: #{groups.size} grupos; matrícula mínima de #{TARGET_PER_GROUP} por grupo; #{students.size} alumnos adicionales."
  end

  def self.seed_guardians(password)
    (1..MIN_RECORDS).map do |n|
      User.find_or_create_by!(email: "familia.demo#{format('%02d', n)}@school.test") do |record|
        record.assign_attributes(name: "Familia de demostración #{n}", role: "guardian", password: password)
      end
    end
  end

  def self.seed_subjects
    topics = %w[Lectura Escritura Ortografia Comprension Pensamiento Logica Numeros Geometria Medicion
      Ciencias Biologia Ecologia Ambiente Historia Regional Geografia Cultura Civismo Etica Arte
      Musica Teatro Movimiento Salud Bienestar Tecnologia Programacion Investigacion Biblioteca]
    topics.each_with_index do |name, i|
      Subject.find_or_create_by!(code: "DM#{format('%02d', i + 1)}") do |record|
        record.name = "Taller de #{name}"
      end
    end
  end

  def self.populate_identity(student, guardian, serial)
    student.addresses.find_or_create_by!(purpose: "home", line1: "Calle Demo #{serial}") do |record|
      record.assign_attributes(country_code: "MX", region: "Estado de México",
        locality: "Municipio de demostración", postal_code: "54700", primary: true)
    end
    student.phone_numbers.find_or_create_by!(purpose: "emergency", number_e164: "+525555#{format('%06d', serial)}") do |record|
      record.assign_attributes(country_code: "MX", primary: true)
    end
    student.contacts.find_or_create_by!(name: guardian.name, relationship: "Tutor") do |record|
      record.assign_attributes(primary: true, emergency: true, pickup_authorized: true)
    end
    number = "+525555#{format('%06d', serial)}"
    identity = DemoFamilyIdentities.attributes(serial)
    contact = StudentContact.find_or_initialize_by(student: student, phone: number)
    contact.assign_attributes(identity.merge(relationship: serial.even? ? "Padre" : "Madre",
      emergency: true, pickup_authorized: true))
    contact.save!
  end

  def self.ensure_progression(student, current_group, current_year, admin)
    grade = current_group.grade_level
    (1..grade).each do |step|
      offset = grade - step
      cycle = if offset.zero?
        current_year
      else
        DemoSchoolCycles.historical!(current: current_year, offset: offset)
      end
      group = offset.zero? ? current_group :
        Group.find_or_create_by!(academic_year: cycle, grade_level: step, section: current_group.section)
      admission = Admission.find_or_create_by!(student: student, academic_year: cycle) do |record|
        record.assign_attributes(grade_level: step, kind: step == 1 ? "new" : "reenrollment", status: "draft")
      end
      if admission.status == "draft"
        admission.update!(status: "approved", folio: "ESC-DEMO-#{student.id}-#{cycle.id}")
      end
      enrollment = Enrollment.find_or_create_by!(student: student, academic_year: cycle) do |record|
        record.assign_attributes(admission: admission, group: group, status: offset.zero? ? "active" : "completed",
          outcome: offset.zero? ? nil : "promoted")
      end
      if !offset.zero? && enrollment.status != "completed"
        enrollment.update!(status: "completed", outcome: "promoted")
      end
      AuditEvent.find_or_create_by!(user: admin, action: "admission.formalized", record_type: "Admission",
        record_id: admission.id)
    end
  end

  def self.seed_classroom(year, students)
    school_days = DemoAcademics.school_days(year).first(3)
    students.each_with_index do |student, i|
      enrollment = student.enrollments.find_by!(academic_year: year)
      course = enrollment.group.courses.order(:id).first!
      school_days.each_with_index do |day, idx|
        Attendance.find_or_create_by!(enrollment: enrollment, on: day) do |record|
          record.status = %w[present present late absent justified][(i + idx) % 5]
        end
      end
      Grade.find_or_create_by!(enrollment: enrollment, course: course, term: 1) do |record|
        published = year.evaluation_period(1)[:ends_on] < Date.current && i.even?
        record.assign_attributes(score: 7 + (i % 4), status: published ? "published" : "draft",
          reviewer: published ? course.teacher : nil,
          reviewed_at: published ? Time.current : nil,
          published_at: published ? Time.current : nil)
      end
      [ "Lectura guiada", "Investigación breve", "Resolución de problemas" ].each_with_index do |topic, task_index|
        assignment = Assignment.find_or_create_by!(course: course, title: "#{topic} de demostración") do |record|
          record.assign_attributes(instructions: "Realiza la actividad #{topic.downcase} y registra tus conclusiones.",
            due_at: (task_index + 7).days.from_now)
        end
        AssignmentSubmission.find_or_create_by!(assignment: assignment, enrollment: enrollment) do |record|
          record.assign_attributes(body: "Respuesta ficticia #{task_index + 1} del alumno #{student.id}.",
            submitted_at: Time.current)
        end
      end
      next unless i < MIN_RECORDS

      first_grade = enrollment.grades.find_by!(course: course, term: 1)
      next unless first_grade.status == "published"

      GradeChangeRequest.find_or_create_by!(grade: first_grade,
        requester: course.teacher, status: "pending") do |record|
        record.assign_attributes(reason: "Revisión de calificación ficticia #{i + 1}", score: 9,
          previous_score: 7 + (i % 4), expected_version: 0)
      end
    end
    year.groups.order(:grade_level, :section).each do |group|
      GenerateSchedule.call(group: group) unless ScheduleSlot.joins(:course).where(courses: { group_id: group.id }).exists?
    end
  end

  def self.seed_communications(year, admin, guardians)
    MIN_RECORDS.times do |i|
      n = i + 1
      Announcement.find_or_create_by!(title: "Aviso de demostración #{format('%02d', n)}") do |record|
        record.assign_attributes(body: "Comunicado escolar ficticio número #{n}.", audience: %w[all guardian teacher student][i % 4])
      end
      InstitutionalMessage.find_or_create_by!(sender: admin, recipient: guardians[i], subject: "Seguimiento de ejemplo #{n}") do |record|
        record.body = "Mensaje institucional ficticio para la familia #{n}."
      end
    end
  end

  def self.seed_calendar(year)
    MIN_RECORDS.times do |i|
      n = i + 1
      CalendarEvent.find_or_create_by!(academic_year: year, title: "Actividad demostrativa #{n}") do |record|
        start_time = (Date.current + (i + 1).days).in_time_zone.change(hour: 9, min: 0)
        record.assign_attributes(kind: %w[activity exam meeting holiday][i % 4],
          starts_at: start_time, ends_at: start_time + 1.hour,
          description: "Actividad escolar ficticia del calendario.")
      end
    end
  end

  def self.seed_documents(students, guardians)
    students.first(MIN_RECORDS).each_with_index do |student, i|
      next if StudentDocument.exists?(student: student, title: "Documento demo #{i + 1}")

      document = StudentDocument.new(student: student, uploader: guardians[i], title: "Documento demo #{i + 1}",
        status: i.even? ? "approved" : "pending")
      document.file.attach(io: StringIO.new(DemoAdmissions::PNG),
        filename: "documento-demo-#{i + 1}.png", content_type: "image/png")
      document.save!
    end
  end
  def self.seed_imports(admin)
    MIN_RECORDS.times do |i|
      filename = "DEMO_PENDIENTE_NO_IMPORTAR_#{format('%02d', i + 1)}.csv"
      next if DataImport.joins(file_attachment: :blob).where(user: admin)
        .where(active_storage_blobs: { filename: filename }).exists?

      row = "DEMO#{format('%06d', i + 700)}HDFRNN00"
      contents = "first_name,last_name,curp,birth_date\\nAlumno,Demostracion,#{row},2018-01-01\\n"
      batch = DataImport.new(user: admin, kind: "students", status: "uploaded")
      batch.file.attach(io: StringIO.new(contents), filename: filename, content_type: "text/csv")
      batch.save!
    end
  end

  def self.seed_reports(year, admin)
    groups = year.groups.where(grade_level: 1..6, section: %w[A B]).order(:grade_level, :section).limit(8)
    %w[enrollments grades attendances schedules].each do |kind|
      groups.each do |group|
        filters = { "academic_year_id" => year.id.to_s, "group_id" => group.id.to_s }
        export = ReportExport.find_or_create_by!(user: admin, kind: kind,
          file_format: "xlsx", filters: filters) do |record|
          record.assign_attributes(status: "queued", expires_at: 1.year.from_now)
        end
        ReportExportJob.perform_now(export.id) if export.status == "queued"
      end
    end
  end
end
