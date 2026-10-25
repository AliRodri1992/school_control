# Computes chart-ready statistics strictly from the authenticated user's grants.
# All data is aggregated server-side; no unscoped student or grade rows reach the client.
class DashboardAnalytics
  MAX_DAYS = 366
  def initialize(user:, filters: {})
    @user = user
    @filters = filters.to_h.symbolize_keys
    @access = SchoolAccess.new(user, "dashboard.show")
  end

  def call
    parse_filters!
    {
      chart_filters: { from: @from.iso8601, to: @to.iso8601,
                       academic_year_id: @year&.id, student_id: @student&.id, group_id: @group&.id },
      enrollment_trend: enrollment_trend,
      students_by_grade: students_by_grade,
      attendance_rate: attendance_rate,
      admission_status: admission_status,
      attendance_trend: attendance_trend,
      grades_by_subject: grades_by_subject,
      grades_by_term: grades_by_term,
      grade_distribution: grade_distribution,
      monthly_absences: monthly_absences,
      assignment_progress: assignment_progress
    }
  end

  private

  def parse_filters!
    @to = parse_date(@filters[:to]) || Date.current
    @from = parse_date(@filters[:from]) || (@to - 5.months).beginning_of_month
    raise ArgumentError, "El periodo del dashboard debe contener entre 1 y 366 días y no puede terminar en el futuro" if
      @from > @to || (@to - @from).to_i >= MAX_DAYS || @to > Date.current
    @year = if @filters[:academic_year_id].present?
      (@access.institution? ? AcademicYear.all : AcademicYear.where(id: @access.groups.select(:academic_year_id))).find(positive_id(@filters[:academic_year_id]))
    end
    @group = @access.groups.find(positive_id(@filters[:group_id])) if @filters[:group_id].present?
    @student = @access.students.find(positive_id(@filters[:student_id])) if @filters[:student_id].present?
  end

  def parse_date(value)
    return nil if value.blank?
    Date.iso8601(value.to_s)
  rescue Date::Error
    raise ArgumentError, "Fecha inválida para los filtros del dashboard"
  end

  def positive_id(value)
    parsed = Integer(value.to_s, 10)
    raise ArgumentError, "Identificador de filtro inválido" if parsed <= 0
    parsed
  rescue ArgumentError
    raise ArgumentError, "Identificador de filtro inválido"
  end

  def enrollments
    scope = @access.enrollments
    scope = scope.where(academic_year_id: @year.id) if @year
    scope = scope.where(group_id: @group.id) if @group
    scope = scope.where(student_id: @student.id) if @student
    scope
  end

  def grades
    # Family and student permissions never include draft/reviewed grades.
    scope = SchoolAccess.new(@user, "grades.index").grades
    scope = scope.where(enrollment_id: enrollments.select(:id)).where(status: "published")
    scope
  end

  def attendance
    return Attendance.none unless @user.can?("attendances.index")
    Attendance.where(enrollment_id: enrollments.select(:id), on: @from..@to)
  end

  def admissions
    return Admission.none unless @user.can?("admissions.index")
    scope = Admission.where(student_id: @access.students.select(:id))
    scope = scope.where(academic_year_id: @year.id) if @year
    scope = scope.where(student_id: @student.id) if @student
    scope = scope.where(student_id: enrollments.select(:student_id)) if @group
    scope
  end

  def enrollment_trend
    return [] unless @user.can?("enrollments.index")
    totals = enrollments.group(:academic_year_id).count
    AcademicYear.where(id: totals.keys).order(:starts_on, :id).map do |year|
      { label: year.name, value: totals.fetch(year.id) }
    end
  end

  def students_by_grade
    return [] unless @user.can?("enrollments.index")
    # By default, compare grade levels in the most recent accessible school year.
    scope = enrollments
    unless @year
      latest = AcademicYear.where(id: scope.select(:academic_year_id)).order(starts_on: :desc, id: :desc).first
      scope = scope.where(academic_year_id: latest.id) if latest
    end
    scope.joins(:group).group("groups.grade_level").distinct.count(:student_id)
      .sort_by { |grade, _| grade.to_i }.map { |grade, count| { label: "#{grade}°", value: count } }
  end

  def attendance_rate
    return [] unless @user.can?("attendances.index")
    totals = attendance.group(:status).count
    return [] if totals.empty?
    [
      { label: "Asistencias", value: totals.fetch("present", 0) + totals.fetch("late", 0) + totals.fetch("justified", 0) },
      { label: "Faltas", value: totals.fetch("absent", 0) }
    ]
  end

  def admission_status
    totals = admissions.group(:status).count
    %w[submitted approved rejected].filter_map do |status|
      { label: { "submitted" => "Enviadas", "approved" => "Aprobadas", "rejected" => "Rechazadas" }.fetch(status), value: totals[status] } if totals[status].to_i.positive?
    end
  end

  def attendance_trend
    rows = attendance.group("DATE_TRUNC('month', attendances.on)", :status).count
    monthly = Hash.new { |hash, key| hash[key] = { total: 0, attended: 0 } }
    rows.each do |(date, status), count|
      key = date.to_date.strftime("%Y-%m")
      monthly[key][:total] += count
      monthly[key][:attended] += count unless status == "absent"
    end
    month_keys.filter_map do |key|
      values = monthly[key]
      { label: key, value: (100.0 * values[:attended] / values[:total]).round(1) } if values[:total].positive?
    end
  end

  def grades_by_subject
    return [] unless @user.can?("grades.index")
    grades.joins(course: :subject).group("subjects.name").average(:score).sort_by(&:first)
      .map { |label, mean| { label: label, value: mean.to_f.round(2) } }
  end

  def grades_by_term
    return [] unless @user.can?("grades.index")
    grades.group(:term).average(:score).sort_by(&:first)
      .map { |term, mean| { label: "Periodo #{term}", value: mean.to_f.round(2) } }
  end

  def grade_distribution
    return [] unless @user.can?("grades.index")
    histogram = grades.group("FLOOR(grades.score)").count
    labels = { 0 => "0–5", 6 => "6", 7 => "7", 8 => "8", 9 => "9", 10 => "10" }
    totals = Hash.new(0)
    histogram.each { |score, count| totals[score.to_i <= 5 ? 0 : score.to_i] += count }
    labels.filter_map { |bucket, label| { label: label, value: totals[bucket] } if totals[bucket].positive? }
  end

  def monthly_absences
    rows = attendance.where(status: %w[absent late]).group("DATE_TRUNC('month', attendances.on)", :status).count
    monthly = Hash.new { |hash, key| hash[key] = { absent: 0, late: 0 } }
    rows.each { |(date, status), count| monthly[date.to_date.strftime("%Y-%m")][status.to_sym] = count }
    month_keys.filter_map do |key|
      values = monthly[key]
      { label: key, absent: values[:absent], late: values[:late] } if values.values.sum.positive?
    end
  end

  def month_keys
    cursor = @from.beginning_of_month
    keys = []
    while cursor <= @to
      keys << cursor.strftime("%Y-%m")
      cursor = cursor.next_month
    end
    keys
  end

  def assignment_progress
    return [] unless @user.can?("assignments.index")
    memberships = enrollments.pluck(:id, :group_id)
    return [] if memberships.empty?
    group_ids = memberships.map(&:last).uniq
    classroom = Assignment.where(published: true, course_id: Course.where(group_id: group_ids).select(:id))
      .where(due_at: @from.beginning_of_day..@to.end_of_day)
      .joins(:course).pluck("assignments.id", "courses.group_id")
    return [] if classroom.empty?
    enrolled = memberships.group_by(&:last)
    expected = classroom.flat_map { |assignment_id, group_id| enrolled.fetch(group_id, []).map { |enrollment_id, _| [assignment_id, enrollment_id] } }
    completed = AssignmentSubmission.where(assignment_id: classroom.map(&:first), enrollment_id: memberships.map(&:first))
      .pluck(:assignment_id, :enrollment_id).to_set
    submitted = expected.count { |pair| completed.include?(pair) }
    [{ label: "Entregadas", value: submitted }, { label: "Pendientes", value: expected.size - submitted }]
  end
end
