# Demo data is opt-in from db/seeds.rb in development only.
# Identifiers, names and uploaded one-pixel images are entirely fictional.
require "base64"
require "stringio"

module DemoAdmissions
  PNG = Base64.decode64(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lYkAAAAASUVORK5CYII="
  ).freeze

  SCENARIOS = [
    [ "DEMO200305MDFRNN03", "Luz", "draft", false ],
    [ "DEMO200406MDFRNN04", "Irene", "draft", true ],
    [ "DEMO200507MDFRNN05", "Mateo", "submitted", true ],
    [ "DEMO200608MDFRNN06", "Elena", "correction_requested", true ],
    [ "DEMO200709MDFRNN07", "Pablo", "approved", true ],
    [ "DEMO200810MDFRNN08", "Lucía", "rejected", true ]
  ].freeze

  def self.seed!(year:, guardian:, admin:)
    SCENARIOS.each_with_index do |(curp, first_name, status, complete), index|
      student = Student.find_or_create_by!(curp: curp) do |person|
        person.assign_attributes(first_name: first_name, last_name: "Demostración",
          birth_date: Date.new(2020, 3 + index, 5 + index), guardian: guardian, nationality: "MX")
      end
      if complete
        complete_record!(student)
        upload_demo_document!(student, guardian, status: status)
      end
      Admission.find_or_create_by!(student: student, academic_year: year) do |admission|
        admission.kind = "new"
        admission.grade_level = 1
        admission.status = status
        admission.reason = "Corrige la constancia de domicilio." if status == "correction_requested"
        admission.reason = "El expediente no cumple la convocatoria." if status == "rejected"
      end
    end
    seed_reenrollment!(year: year, guardian: guardian, admin: admin)
  end

  def self.complete_record!(student)
    student.addresses.find_or_create_by!(purpose: "home", line1: "Calle Demostración 20") do |address|
      address.assign_attributes(country_code: "MX", region: "Estado de México", locality: "Municipio Ficticio",
        postal_code: "54700", primary: true)
    end
    student.phone_numbers.find_or_create_by!(purpose: "emergency", number_e164: "+525555123400") do |phone|
      phone.assign_attributes(country_code: "MX", primary: true)
    end
    student.contacts.find_or_create_by!(name: "Responsable de demostración", relationship: "Tutor") do |contact|
      contact.assign_attributes(primary: true, emergency: true, pickup_authorized: true)
    end
  end

  def self.upload_demo_document!(student, guardian, status:)
    title = "Documento ficticio de identidad"
    return if StudentDocument.exists?(student: student, title: title)

    document = StudentDocument.new(student: student, uploader: guardian, title: title,
      status: status == "approved" ? "approved" : "pending")
    document.file.attach(io: StringIO.new(PNG), filename: "demostracion.png", content_type: "image/png")
    document.save!
  end

  def self.seed_reenrollment!(year:, guardian:, admin:)
    student = Student.find_or_create_by!(curp: "DEMO200911HDFRNN09") do |person|
      person.assign_attributes(first_name: "Diego", last_name: "Demostración",
        birth_date: Date.new(2020, 9, 11), guardian: guardian)
    end
    complete_record!(student)
    prior = DemoSchoolCycles.historical!(current: year, offset: 1)
    previous_group = Group.find_or_create_by!(academic_year: prior, grade_level: 1, section: "A")
    previous = Admission.find_or_create_by!(student: student, academic_year: prior) do |admission|
      admission.assign_attributes(kind: "new", grade_level: 1, status: "approved")
    end
    Enrollment.find_or_create_by!(admission: previous) do |enrollment|
      enrollment.assign_attributes(student: student, academic_year: prior, group: previous_group,
        status: "completed", outcome: "promoted")
    end
    next_group = Group.find_or_create_by!(academic_year: year, grade_level: 2, section: "A")
    current = Admission.find_or_create_by!(student: student, academic_year: year) do |admission|
      admission.assign_attributes(kind: "reenrollment", grade_level: 2, status: "approved")
    end
    AdmitStudent.call(admission: current, group: next_group, actor: admin) if current.status == "approved" && !current.enrollment
  end
end
