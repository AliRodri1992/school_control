class RequestGradeChange
  def self.call(grade:, actor:, attributes:, expected_version:)
    unless actor.can?("grade_change_requests.create", grade)
      raise ArgumentError, "No puedes solicitar cambios en esta calificación"
    end
    grade.enrollment.with_lock do
      grade.reload
      raise ArgumentError, "Solo se pueden corregir calificaciones publicadas" unless grade.status == "published"
      raise ArgumentError, "La calificación cambió. Actualiza la pantalla." unless grade.lock_version == Integer(expected_version)
      raise ArgumentError, "Ya existe una solicitud pendiente" if grade.change_requests.pending.exists?
      request = grade.change_requests.build(attributes.slice(:score, :feedback, :reason))
      request.assign_attributes(requester: actor, expected_version: grade.lock_version,
        previous_score: grade.score, previous_feedback: grade.feedback)
      request.validate!
      if request.score == grade.score && request.feedback.to_s == grade.feedback.to_s
        raise ArgumentError, "No hay cambios para corregir"
      end
      request.save!
      AuditEvent.create!(user: actor, action: "grade_change.requested", record_type: "GradeChangeRequest", record_id: request.id)
      request
    end
  end
end
