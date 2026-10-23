class GradeWorkflow
  def self.review(grade:, actor:)
    transition(grade, actor, "draft", "reviewed") do
      grade.assign_attributes(reviewer: actor, reviewed_at: Time.current)
    end
  end

  def self.publish(grade:, actor:)
    transition(grade, actor, "reviewed", "published") do
      grade.published_at = Time.current
    end
  end

  def self.correct(grade:, actor:, attributes:, reason:, expected_version:)
    raise ArgumentError, "Solo administración puede corregir calificaciones publicadas" unless actor.admin?
    grade.enrollment.with_lock do
      grade.reload
      raise ArgumentError, "La calificación aún no está publicada" unless grade.status == "published"
      unless grade.lock_version == Integer(expected_version)
        raise ArgumentError, "La calificación cambió. Actualiza la pantalla antes de corregirla."
      end
      raise ArgumentError, "Resuelve la solicitud pendiente antes de corregir directamente" if grade.change_requests.pending.exists?
      previous = { previous_score: grade.score, previous_feedback: grade.feedback }
      grade.correction_authorized = true
      grade.assign_attributes(attributes.slice(:score, :feedback))
      raise ArgumentError, "No hay cambios para corregir" unless grade.score_changed? || grade.feedback_changed?
      grade.save!
      correction = grade.corrections.create!(**previous, actor: actor, reason: reason, score: grade.score, feedback: grade.feedback)
      AuditEvent.create!(user: actor, action: "grade.corrected", record_type: "Grade", record_id: grade.id,
        changes_summary: { correction_id: correction.id })
    end
    grade
  ensure
    grade.correction_authorized = false
  end

  def self.transition(grade, actor, from, to)
    raise ArgumentError, "Solo administración puede revisar y publicar" unless actor.admin?
    grade.enrollment.with_lock do
      grade.reload
      raise ArgumentError, "La calificación cambió de estado. Actualiza la pantalla." unless grade.status == from
      yield
      grade.update!(status: to)
      AuditEvent.create!(user: actor, action: "grade.#{to}", record_type: "Grade", record_id: grade.id)
    end
    grade
  end
  private_class_method :transition
end
