# The only permitted writer of AcademicYear.status. Each transition is atomic,
# idempotent, and audited; the scheduler and explicit admin saves share this path.
class AcademicYearLifecycle
  NEXT = { "draft" => "active", "active" => "closing",
           "closing" => "closed", "closed" => "archived" }.freeze

  def self.preview(year, today: Time.zone.today)
    checks = checks_for(year, today: today)
    {
      status: year.status, next_status: NEXT[year.status],
      due_on: due_on(year), critical: checks,
      can_advance: checks.none? { |item| item[:blocking] && !item[:ok] },
      transitions: year.status_transitions.order(occurred_at: :desc, id: :desc).limit(30).map do |transition|
        { from_status: transition.from_status, to_status: transition.to_status,
          reason: transition.reason, trigger: transition.trigger, occurred_at: transition.occurred_at }
      end
    }
  end

  def self.due_on(year)
    case year.status
    when "draft" then year.starts_on
    when "active" then year.ends_on
    when "closing" then year.administrative_close_date
    when "closed" then year.archive_date
    end
  end

  def self.checks_for(year, today: Time.zone.today)
    return [] unless NEXT.key?(year.status)

    checks = [
      { key: "date", label: "Fecha programada alcanzada",
        ok: due_on(year).present? && today >= due_on(year), blocking: true }
    ]
    case year.status
    when "draft"
      valid_terms = year.evaluation_periods.all? { |term| term[:starts_on].present? && term[:ends_on].present? }
      checks << { key: "trimesters", label: "Tres trimestres configurados", ok: valid_terms, blocking: true }
      checks << { key: "academic_configuration", label: "Cuatro campos formativos disponibles",
                  ok: FormativeEvaluation::FIELDS.size == 4, blocking: true }
      checks << { key: "active_conflict", label: "Sin otro ciclo activo",
                  ok: !AcademicYear.where(status: "active").where.not(id: year.id).exists?, blocking: true }
      checks << { key: "school", label: "Escuela configurada", ok: School.exists?, blocking: true }
      checks << { key: "groups", label: "Grupos preparados (recomendado)",
                  ok: year.groups.exists?, blocking: false }
    when "closing"
      checks << { key: "enrollments", label: "Alumnos con situación final registrada",
                  ok: !year.enrollments.where.not(status: "completed").exists?, blocking: true }
      checks << { key: "admissions", label: "Solicitudes académicas resueltas",
                  ok: !year.admissions.where(status: %w[submitted correction_requested approved]).exists?, blocking: true }
      grades = Grade.where(enrollment_id: year.enrollments.select(:id))
      checks << { key: "corrections", label: "Sin rectificaciones de calificaciones pendientes",
                  ok: !GradeChangeRequest.pending.where(grade_id: grades.select(:id)).exists?, blocking: true }
      checks << { key: "grades", label: "Sin calificaciones trimestrales en borrador",
                  ok: !grades.where.not(status: "published").exists?, blocking: true }
      evaluations = FormativeEvaluation.where(enrollment_id: year.enrollments.select(:id))
      checks << { key: "formative", label: "Campos formativos publicados",
                  ok: !evaluations.where.not(status: "published").exists? &&
                    evaluations.count == year.enrollments.count * 12, blocking: true }
    when "closed"
      grades = Grade.where(enrollment_id: year.enrollments.select(:id))
      checks << { key: "corrections", label: "Sin rectificaciones abiertas",
                  ok: !GradeChangeRequest.pending.where(grade_id: grades.select(:id)).exists?, blocking: true }
    end
    checks
  end

  def self.advance!(year, today: Time.zone.today, trigger: "automatic")
    year.with_lock do
      year.reload
      target = NEXT[year.status]
      return false unless target
      checks = checks_for(year, today: today)
      return false if checks.any? { |item| item[:blocking] && !item[:ok] }

      previous = year.status
      year.lifecycle_transition_authorized = true
      year.update!(status: target, status_changed_at: Time.current)
      year.status_transitions.create!(from_status: previous, to_status: target,
        trigger: trigger, reason: "Transición automática por fecha y verificaciones académicas",
        checks: checks.index_by { |item| item[:key] }, occurred_at: Time.current)
      AuditEvent.create!(action: "academic_year.#{target}", record_type: "AcademicYear",
        record_id: year.id, changes_summary: { from: previous, to: target, trigger: trigger })
      true
    ensure
      year.lifecycle_transition_authorized = false
    end
  end

  def self.run_all!(today: Time.zone.today)
    AcademicYear.where(status: NEXT.keys).order(:starts_on, :id).find_each do |year|
      advance!(year, today: today)
    end
  end
end
