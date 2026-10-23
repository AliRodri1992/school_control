class SchoolReport
  TYPES = {
    "enrollments" => [ "Matrícula", %w[Alumno Ciclo Grupo Estado Resultado] ],
    "grades" => [ "Calificaciones", %w[Alumno Grupo Materia Trimestre Calificación Estado] ],
    "attendances" => [ "Asistencia", %w[Alumno Grupo Fecha Estado] ],
    "admissions" => [ "Inscripciones", %w[Folio Alumno Ciclo Grado Tipo Estado] ],
    "schedules" => [ "Horarios", %w[Grupo Materia Docente Día Inicio Fin Aula] ],
    "audit" => [ "Auditoría", %w[Fecha Responsable Acción Tipo Registro] ]
  }.freeze
  FILTERS = {
    "enrollments" => %w[academic_year_id group_id student_id], "grades" => %w[academic_year_id group_id student_id course_id term],
    "attendances" => %w[academic_year_id group_id student_id from to], "admissions" => %w[academic_year_id student_id],
    "schedules" => %w[academic_year_id group_id course_id], "audit" => %w[from to]
  }.freeze
  attr_reader :kind, :filters, :access

  def initialize(user:, kind:, action:, filters: {})
    raise ArgumentError, "Reporte inválido" unless TYPES.key?(kind)
    @kind, @filters, @user = kind, filters.stringify_keys.slice("academic_year_id", "group_id", "student_id", "course_id", "term", "from", "to"), user
    @access = SchoolAccess.new(user, "report_#{kind}.#{action}")
    raise ArgumentError, "Sin permiso para este reporte" unless access.allows?
    validate_filters!
  end

  def fingerprint
    context = access.institution? ? [ "institution" ] : [ access.scopes.sort, access.students.order(:id).ids, access.courses.order(:id).ids ]
    Digest::SHA256.hexdigest(context.to_json)
  end

  def title = TYPES.fetch(kind).first
  def headers = TYPES.fetch(kind).last

  def relation
    case kind
    when "enrollments" then enrollment_scope.includes(:student, :academic_year, :group)
    when "grades"
      scope = access.grades.where(enrollment: enrollment_scope).includes(:course, enrollment: [ :student, :group ])
      scope = scope.where(term: filters["term"]) if filters["term"].present?
      scope = scope.where(course_id: filters["course_id"]) if filters["course_id"].present?
      scope
    when "attendances"
      date_filter(Attendance.where(enrollment: enrollment_scope).includes(enrollment: [ :student, :group ]), :on)
    when "admissions"
      scope = Admission.where(student: access.students).includes(:student, :academic_year)
      scope = scope.where(academic_year_id: filters["academic_year_id"]) if filters["academic_year_id"].present?
      scope = scope.where(student_id: filters["student_id"]) if filters["student_id"].present?
      scope
    when "schedules"
      courses = access.courses.where(group: group_scope)
      courses = courses.where(id: filters["course_id"]) if filters["course_id"].present?
      ScheduleSlot.where(course: courses).includes(course: [ :subject, :teacher, :group ])
    when "audit" then date_filter(AuditEvent.includes(:user), :created_at)
    end
  end

  def row(record)
    case kind
    when "enrollments" then [ record.student.full_name, record.academic_year.name, record.group.label, record.status, record.outcome ]
    when "grades" then [ record.enrollment.student.full_name, record.enrollment.group.label, record.course.subject.name, record.term, record.score.to_f, record.status ]
    when "attendances" then [ record.enrollment.student.full_name, record.enrollment.group.label, record.on.iso8601, record.status ]
    when "admissions" then [ record.folio, record.student.full_name, record.academic_year.name, record.grade_level, record.kind, record.status ]
    when "schedules" then [ record.course.group.label, record.course.subject.name, record.course.teacher.name, record.weekday, time(record.starts_minute), time(record.ends_minute), record.room ]
    when "audit" then [ record.created_at.iso8601, record.user&.name, record.action, record.record_type, record.record_id ]
    end
  end

  def rows(limit: 10_000, offset: 0)
    relation.order(:id).limit(limit).offset(offset).map { |record| row(record) }
  end

  private

  def group_scope
    scope = access.groups
    scope = scope.where(academic_year_id: filters["academic_year_id"]) if filters["academic_year_id"].present?
    scope = scope.where(id: filters["group_id"]) if filters["group_id"].present?
    scope
  end

  def enrollment_scope
    scope = access.enrollments.where(group: group_scope)
    scope = scope.where(student_id: filters["student_id"]) if filters["student_id"].present?
    scope
  end

  def validate_filters!
    raise ArgumentError, "Filtro no disponible para este reporte" if (filters.reject { |_, value| value.blank? }.keys - FILTERS.fetch(kind)).any?
    filters.each do |key, value|
      next if value.blank?
      if %w[from to].include?(key)
        Date.iso8601(value)
      else
        raise ArgumentError, "Filtro inválido" unless value.to_s.match?(/\A[1-9]\d*\z/)
      end
    end
    raise ArgumentError, "El trimestre debe ser de 1 a 3" if filters["term"].present? && !(1..3).cover?(filters["term"].to_i)
    raise ArgumentError, "El periodo está invertido" if filters["from"].present? && filters["to"].present? && filters["from"] > filters["to"]
  end

  def date_filter(scope, column)
    # Use a column reference rather than interpolating SQL, even for trusted symbols.
    attribute = scope.klass.arel_table[column]
    scope = scope.where(attribute.gteq(Date.iso8601(filters["from"]))) if filters["from"].present?
    if filters["to"].present?
      finish = Date.iso8601(filters["to"])
      scope = scope.where(attribute.lt(finish + 1.day))
    end
    scope
  end

  def time(minutes) = format("%02d:%02d", minutes / 60, minutes % 60)
end
