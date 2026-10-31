class CompleteEnrollment
  def self.call(enrollment:, outcome:, actor:, reason: nil)
    enrollment.with_lock do
      raise ArgumentError, "El ciclo escolar está cerrado" if enrollment.academic_year.closed_for_academics?
      raise ArgumentError, "La inscripción ya está cerrada" unless enrollment.status == "active"
      allowed = enrollment.group.grade_level == 6 ? %w[graduated repeat] : %w[promoted repeat]
      raise ArgumentError, "Resultado incompatible con el grado" unless allowed.include?(outcome)
      courses = enrollment.group.courses
      if courses.exists?
        expected = courses.count * 3
        raise ArgumentError, "Faltan calificaciones trimestrales publicadas" unless enrollment.grades.published.where(course: courses).count == expected
      end
      grading = PrimarySchoolGrading.report(enrollment: enrollment)
      raise ArgumentError, "Faltan evaluaciones oficiales publicadas de los cuatro campos formativos" unless grading[:complete]
      if outcome != grading[:recommendation]
        raise ArgumentError, "La excepción académica debe justificarse con al menos 10 caracteres" if reason.to_s.strip.length < 10
        raise ArgumentError, "Primer grado se acredita por haberlo cursado" if grading[:grade_level] == 1
      end
      enrollment.update!(status: "completed", outcome: outcome,
        promotion_authorized_by_id: actor.id, promotion_authorized_at: Time.current,
        promotion_exception_reason: outcome == grading[:recommendation] ? nil : reason.to_s.strip)
      AuditEvent.create!(user: actor, action: "enrollment.completed", record_type: "Enrollment", record_id: enrollment.id, changes_summary: { outcome: outcome, recommended: grading[:recommendation], average: grading[:annual_average], rule: grading[:rule_version], exception_reason: enrollment.promotion_exception_reason })
    end
    AcademicYearLifecycle.advance!(enrollment.academic_year, trigger: "enrollment_completed")
  end
end
