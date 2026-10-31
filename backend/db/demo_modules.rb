# Additional opt-in demonstration records; never executed in production or test.
# Preserve existing user data and use deterministic natural keys on repeat runs.
module DemoModules
  def self.seed!(year:, guardian:, admin:, learner:, student:)
    raise "Demo modules are development-only" unless Rails.env.development?
    enrollment = student.enrollments.find_by(academic_year: year)
    return unless enrollment

    teacher = enrollment.group.courses.first&.teacher
    course = enrollment.group.courses.first
    seed_academics(enrollment, course, teacher, year) if course
    seed_communications(guardian, teacher, admin, year)
    seed_family(student, guardian)
    seed_preferences(guardian, learner)
    seed_calendar(year)
  end

  def self.seed_academics(enrollment, course, teacher, year)
    assignment = Assignment.find_or_create_by!(course: course, title: "Lectura de demostración") do |record|
      record.instructions = "Lee un cuento breve y escribe tres ideas principales."
      record.due_at = 7.days.from_now
    end
    AssignmentSubmission.find_or_create_by!(assignment: assignment, enrollment: enrollment) do |record|
      record.body = "Tres ideas sobre la lectura de demostración."
      record.submitted_at = Time.current
    end
    [ 1, 2, 3 ].each do |term|
      Grade.find_or_create_by!(enrollment: enrollment, course: course, term: term) do |record|
        record.score = 8 + (term % 2)
        closed_period = year.evaluation_period(term)[:ends_on] < Date.current
        record.status = closed_period ? "published" : "draft"
        record.reviewer = teacher if closed_period
        record.reviewed_at = Time.current if closed_period
        record.published_at = Time.current if closed_period
      end
    end
    grade = Grade.find_by!(enrollment: enrollment, course: course, term: 1)
    if teacher && grade.status == "published"
      GradeChangeRequest.find_or_create_by!(grade: grade, status: "pending") do |record|
        record.requester = teacher
        record.reason = "Revisar calificación de demostración."
        record.score = 9
        record.previous_score = grade.score
        record.expected_version = grade.lock_version || 0
      end
    end
    first_day = [ year.starts_on, Date.current - 7.days ].max
    last_day = [ year.ends_on, Date.current ].min
    if first_day <= last_day
      DemoAcademics.school_days(year).select { |day| day >= first_day && day <= last_day }
        .first(4).each_with_index do |day, index|
        Attendance.find_or_create_by!(enrollment: enrollment, on: day) do |record|
          record.status = %w[present present late justified][index]
        end
      end
    end
  end

  def self.seed_communications(guardian, teacher, admin, year)
    Announcement.find_or_create_by!(title: "Aviso escolar de demostración") do |record|
      record.body = "Recuerda revisar el calendario y los comunicados escolares."
      record.audience = "all"
    end
    recipient = teacher || guardian
    InstitutionalMessage.find_or_create_by!(sender: admin, recipient: recipient,
      subject: "Seguimiento escolar de demostración") do |record|
      record.body = "Mensaje ficticio para probar la bandeja institucional."
    end
  end

  def self.seed_family(student, guardian)
    require_relative "demo_family_identities"
    contact = StudentContact.find_or_initialize_by(student: student, phone: "+525555000011")
    contact.assign_attributes(DemoFamilyIdentities.attributes(400).merge(
      relationship: "Familiar", emergency: true, pickup_authorized: true))
    contact.save!
    student.notes.find_or_create_by!(body: "Seguimiento interno de demostración") do |record|
      record.author = guardian
      record.category = "general"
      record.visibility = "shared"
    end
  end

  def self.seed_preferences(guardian, learner)
    [ guardian, learner ].each do |user|
      UserPreference.find_or_create_by!(user: user)
    end
  end

  def self.seed_calendar(year)
    day = ([ Date.current + 14.days, year.starts_on ].max..year.ends_on)
      .find do |date|
        (1..5).cover?(date.wday) && year.calendar_events
          .where(kind: %w[holiday vacation suspension cte], all_day: true)
          .none? { |event| date >= event.starts_at.to_date && date < event.ends_at.to_date }
      end
    day ||= DemoAcademics.school_days(year).last
    return unless day

    CalendarEvent.find_or_create_by!(academic_year: year, title: "Evaluación de demostración") do |record|
      record.starts_at = day.in_time_zone.change(hour: 9)
      record.ends_at = record.starts_at + 1.hour
      record.kind = "exam"
      record.description = "Ejemplo ficticio de evaluación programada."
    end
  end
end
