# Detailed, repeatable classroom examples. Loaded only by development DEMO_SEEDS.
# Existing academic records are never changed; the seed only fills missing examples.
module DemoAcademics
  CORE_SUBJECTS = {
    "ESP" => [ "Español", 3 ],
    "MAT" => [ "Matemáticas", 3 ],
    "CIE" => [ "Ciencias naturales", 3 ],
    "HIS" => [ "Historia", 3 ],
    "GEO" => [ "Geografía", 3 ],
    "ART" => [ "Artes", 3 ],
    "EDF" => [ "Educación física", 3 ],
    "ING" => [ "Inglés", 2 ],
    "FCE" => [ "Formación cívica y ética", 2 ],
    "VID" => [ "Vida saludable", 2 ]
  }.freeze
  SECOND_TERM = %w[ESP MAT CIE].freeze
  THIRD_TERM = %w[ESP].freeze
  ATTENDANCE_DAYS = 15

  def self.seed!(year:, admin:)
    raise "Las semillas académicas solo se ejecutan en desarrollo" unless Rails.env.development?

    days = school_days(year)
    year.groups.where(grade_level: 1..6, section: %w[A B]).order(:grade_level, :section).each do |group|
      seed_group!(group: group, admin: admin, days: days)
    end
    puts "Demo académico: #{CORE_SUBJECTS.length} materias troncales, horarios, evaluaciones, asistencia y tareas."
  end

  def self.school_days(year)
    last_day = [ year.ends_on, Date.current ].min
    return [] if last_day < year.starts_on

    blocked = year.calendar_events.where(kind: %w[holiday vacation suspension cte], all_day: true)
      .flat_map do |event|
        (event.starts_at.to_date...event.ends_at.to_date).to_a
      end.to_set
    (year.starts_on..last_day).select { |day| (1..5).cover?(day.wday) && !blocked.include?(day) }
      .last(ATTENDANCE_DAYS)
  end

  def self.seed_group!(group:, admin:, days: school_days(group.academic_year))
    courses = group.courses.includes(:subject, :teacher).select do |course|
      CORE_SUBJECTS.key?(course.subject.code)
    end.sort_by { |course| [ CORE_SUBJECTS.keys.index(course.subject.code), course.id ] }

    ensure_schedules!(courses)
    enrollments = group.enrollments.where(status: "active").order(:id).to_a
    enrollments.each_with_index do |enrollment, index|
      seed_attendance!(enrollment, days, index)
      seed_grades!(enrollment, courses, index)
      seed_formative_evaluations!(enrollment, courses, index)
      seed_student_note!(enrollment, admin, index) if index < 3
    end
    seed_assignments!(courses, enrollments)
  end

  def self.ensure_schedules!(courses)
    courses.each do |course|
      existing = course.schedule_slots.count
      next if existing >= course.weekly_periods

      (course.weekly_periods - existing).times do
        slot = GenerateSchedule.candidates(course).find(&:valid?)
        raise "No hay espacios libres para #{course.label}; revise el horario del grupo" unless slot

        slot.save!
      end
    end
  end

  def self.seed_attendance!(enrollment, days, index)
    days.each_with_index do |day, day_index|
      # A repeatable distribution: mostly present, with realistic late/absent cases.
      category = (index * 3 + day_index) % 20
      status = if category < 14 then "present"
      elsif category < 17 then "late"
      elsif category == 17 then "justified"
      else "absent"
      end
      Attendance.find_or_create_by!(enrollment: enrollment, on: day) do |record|
        record.status = status
        record.notes = "Incidencia ficticia para seguimiento escolar." if %w[absent justified].include?(status)
      end
    end
  end

  def self.seed_grades!(enrollment, courses, index)
    courses.each do |course|
      (1..3).each do |term|
        Grade.find_or_create_by!(enrollment: enrollment, course: course, term: term) do |record|
          score = 6 + ((enrollment.id + course.id + term) % 9) * 0.5
          period = enrollment.academic_year.evaluation_period(term)
          state = if period[:ends_on] && period[:ends_on] < Date.current
            index % 5 == 0 ? "reviewed" : "published"
          else
            "draft"
          end
          record.assign_attributes(score: score, status: state,
            feedback: "Evaluación ficticia del periodo #{term}: avance en #{course.subject.name}.")
          if %w[reviewed published].include?(state)
            record.reviewer = course.teacher
            record.reviewed_at = Time.current
            record.published_at = Time.current if state == "published"
          end
        end
      end
    end
  end

  def self.seed_formative_evaluations!(enrollment, courses, index)
    FormativeEvaluation::FIELDS.each do |code, details|
      (1..3).each do |term|
        period = enrollment.academic_year.evaluation_period(term)
        marks = Grade.where(enrollment: enrollment, course: courses.select { |course| details[:subjects].include?(course.subject.code) }, term: term).pluck(:score)
        next if marks.empty?
        score = (marks.sum / marks.length).round.clamp(enrollment.group.grade_level <= 2 ? 6 : 5, 10)
        state = period[:ends_on] && period[:ends_on] < Date.current && index % 5 != 0 ? "published" : "draft"
        FormativeEvaluation.find_or_create_by!(enrollment: enrollment, field_code: code, term: term) do |record|
          record.assign_attributes(score: score, status: state,
            feedback: "Valoración ficticia del campo #{details[:name]} en el trimestre #{term}.")
          if state == "published"
            record.reviewer = courses.first.teacher
            record.published_at = Time.current
          end
        end
      end
    end
  end

  def self.seed_assignments!(courses, enrollments)
    courses.select { |course| %w[ESP MAT CIE ING].include?(course.subject.code) }.each do |course|
      assignment = Assignment.find_or_create_by!(course: course,
        title: "Actividad de #{course.subject.name} · demostración") do |record|
        record.assign_attributes(
          instructions: "Actividad ficticia de #{course.subject.name}. Revisa el tema, realiza los ejercicios y entrega tus conclusiones.",
          due_at: 10.days.from_now, published: true)
      end
      enrollments.each_with_index do |enrollment, index|
        next if index % 6 == 0 # Leave some tasks pending for the classroom dashboard.

        AssignmentSubmission.find_or_create_by!(assignment: assignment, enrollment: enrollment) do |record|
          record.assign_attributes(
            body: "Entrega de demostración de #{enrollment.student.full_name} para #{course.subject.name}.",
            submitted_at: Time.current - (index % 4).days,
            score: index.even? ? 7 + index % 4 : nil,
            feedback: index.even? ? "Buen trabajo, continúa practicando." : nil,
            reviewer: index.even? ? course.teacher : nil,
            reviewed_at: index.even? ? Time.current : nil)
        end
      end
    end
  end

  def self.seed_student_note!(enrollment, admin, index)
    enrollment.student.notes.find_or_create_by!(
      body: "Observación académica ficticia #{index + 1} del ciclo #{enrollment.academic_year.name}.") do |note|
      note.assign_attributes(author: admin, category: "seguimiento", visibility: "internal")
    end
  end
end
