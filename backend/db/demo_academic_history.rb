# Development-only academic history: courses and three term marks for each prior grade.
# Current-year evaluations remain owned by DemoAcademics; this never changes real marks.
module DemoAcademicHistory
  TERMS = (1..3).freeze

  def self.seed!(year:)
    raise "Las semillas históricas solo se ejecutan en desarrollo" unless Rails.env.development?

    current_enrollments = Enrollment.where(academic_year: year).includes(group: :courses).to_a
    teacher_by_student = current_enrollments.to_h do |enrollment|
      [ enrollment.student_id, enrollment.group.courses.first&.teacher ]
    end
    return if teacher_by_student.empty?

    subjects = Subject.where(code: DemoAcademics::CORE_SUBJECTS.keys).index_by(&:code)
    raise "Faltan materias para el historial académico" unless subjects.size == DemoAcademics::CORE_SUBJECTS.size

    histories = Enrollment.joins(:student, :academic_year)
      .includes(:group, :academic_year)
      .where(student_id: teacher_by_student.keys, status: "completed")
      .where("students.curp LIKE ?", "DEMO%")
      .where("academic_years.name LIKE ?", "Demo histórico %")
      .order(:academic_year_id, :group_id, :student_id)

    groups_seeded = 0
    histories.group_by(&:group_id).each_value do |enrollments|
      teacher = teacher_by_student.fetch(enrollments.first.student_id)
      seed_group!(group: enrollments.first.group, enrollments: enrollments, teacher: teacher, subjects: subjects)
      groups_seeded += 1
    end
    puts "Demo histórico: #{groups_seeded} grupos anteriores, 10 materias y 3 trimestres por grado completado."
  end

  def self.seed_group!(group:, enrollments:, teacher:, subjects:)
    raise "Docente histórico inválido" unless teacher&.teacher? && teacher.active?
    raise "El historial debe ser de ciclos terminados" unless group.academic_year.ends_on < Date.current
    raise "Las inscripciones históricas deben estar completadas" unless enrollments.all? do |enrollment|
      enrollment.group_id == group.id && enrollment.academic_year_id == group.academic_year_id &&
        enrollment.status == "completed"
    end

    year = group.academic_year
    # Historical seed data may predate evaluation-period configuration.
    # Derive missing boundaries in memory; never mutate a year after its
    # admissions and enrollments have been attached to the academic record.
    width = (year.ends_on - year.starts_on).to_i
    fallback_ends = [ year.starts_on + width / 3, year.starts_on + width * 2 / 3, year.ends_on ]
    term_ends = (1..3).map { |term| year.evaluation_period(term)[:ends_on] || fallback_ends.fetch(term - 1) }

    courses = DemoAcademics::CORE_SUBJECTS.map do |code, (_, periods)|
      subject = subjects.fetch(code)
      Course.find_or_create_by!(group: group, subject: subject) do |course|
        course.teacher = teacher
        course.weekly_periods = periods
      end
    end

    rows = enrollments.flat_map do |enrollment|
      courses.flat_map do |course|
        TERMS.map { |term| historical_mark(enrollment, course, term) }
      end
    end
    # A unique database index skips existing marks, including manually corrected ones.
    # Only generated, closed-year demo enrollments reach this development-only bulk insert.
    grade_keys = Grade.where(enrollment_id: enrollments.map(&:id))
      .pluck(:enrollment_id, :course_id, :term).to_set
    rows.reject! do |row|
      grade_keys.include?([ row[:enrollment_id], row[:course_id], row[:term] ])
    end
    Grade.insert_all(rows, unique_by: :index_grades_on_enrollment_id_and_course_id_and_term,
      returning: false) if rows.any?

    field_rows = enrollments.flat_map do |enrollment|
      FormativeEvaluation::FIELDS.flat_map do |code, details|
        (1..3).map do |term|
          values = courses.select { |course| details.fetch(:subjects).include?(course.subject.code) }
            .filter_map { |course| Grade.find_by(enrollment: enrollment, course: course, term: term)&.score }
          next if values.empty?
          day = term_ends.fetch(term - 1)
          published_at = Time.zone.local(day.year, day.month, day.day, 16)
          { enrollment_id: enrollment.id, field_code: code, term: term,
            score: (values.sum / values.length).round.clamp(enrollment.group.grade_level <= 2 ? 6 : 5, 10),
            status: "published", feedback: "Valoración histórica ficticia: #{details[:name]}, trimestre #{term}.",
            reviewer_id: course_teacher_id(courses), published_at: published_at,
            created_at: published_at, updated_at: published_at }
        end
      end
    end.compact
    field_keys = FormativeEvaluation.where(enrollment_id: enrollments.map(&:id))
      .pluck(:enrollment_id, :field_code, :term).to_set
    field_rows.reject! do |row|
      field_keys.include?([ row[:enrollment_id], row[:field_code], row[:term] ])
    end
    FormativeEvaluation.insert_all(field_rows,
      unique_by: :idx_formative_evaluations_enrollment_field_term, returning: false) if field_rows.any?
  end

  def self.course_teacher_id(courses) = courses.first.teacher_id

  def self.historical_mark(enrollment, course, term)
    year = enrollment.academic_year
    # Historical enrollments may hold a cached year before its periods were initialized.
    day = year.evaluation_period(term)[:ends_on] ||
      year.starts_on + ((year.ends_on - year.starts_on).to_i * term / 3)
    published_at = Time.zone.local(day.year, day.month, day.day, 16)
    offset = (enrollment.student_id * 7 + course.subject_id * 3 + enrollment.group.grade_level + term * 5) % 9
    {
      enrollment_id: enrollment.id,
      course_id: course.id,
      term: term,
      score: 6 + (offset * 0.5),
      status: "published",
      feedback: "Evaluación ficticia de #{course.subject.name}, #{enrollment.group.grade_level}° grado, trimestre #{term}.",
      reviewer_id: course.teacher_id,
      reviewed_at: published_at - 1.day,
      published_at: published_at,
      created_at: published_at - 1.day,
      updated_at: published_at
    }
  end
end
