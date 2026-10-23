class ResolveGradeChange
  def self.call(request:, actor:, decision:, reason:)
    raise ArgumentError, "Solo administración puede resolver solicitudes" unless actor.can?("grade_change_requests.resolve", request.grade)
    raise ArgumentError, "Resolución inválida" unless %w[approved rejected].include?(decision)
    request.grade.enrollment.with_lock do
      request.reload
      raise ArgumentError, "La solicitud ya fue resuelta" unless request.status == "pending"
      raise ArgumentError, "No puedes resolver tu propia solicitud" if request.requester_id == actor.id
      request.update!(status: decision, resolver: actor, resolved_at: Time.current, resolution_reason: reason)
      if decision == "approved"
        GradeWorkflow.correct(grade: request.grade, actor: actor, expected_version: request.expected_version,
          attributes: { score: request.score, feedback: request.feedback }, reason: request.reason, permission: "grade_change_requests.resolve")
      end
      AuditEvent.create!(user: actor, action: "grade_change.#{decision}", record_type: "GradeChangeRequest", record_id: request.id)
      request
    end
  end
end
