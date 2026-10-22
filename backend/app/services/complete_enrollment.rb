class CompleteEnrollment
  def self.call(enrollment:, outcome:, actor:)
    enrollment.with_lock do
      raise ArgumentError, "La inscripción ya está cerrada" unless enrollment.status == "active"
      allowed = enrollment.group.grade_level == 6 ? %w[graduated repeat] : %w[promoted repeat]
      raise ArgumentError, "Resultado incompatible con el grado" unless allowed.include?(outcome)
      courses = enrollment.group.courses
      raise ArgumentError, "Configure las materias antes de cerrar" if courses.empty?
      expected = courses.count * 3
      raise ArgumentError, "Faltan calificaciones trimestrales publicadas" unless enrollment.grades.published.where(course: courses).count == expected
      enrollment.update!(status: "completed", outcome: outcome)
      AuditEvent.create!(user: actor, action: "enrollment.completed", record_type: "Enrollment", record_id: enrollment.id, changes_summary: { outcome: outcome })
    end
  end
end
