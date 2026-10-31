class AdmitStudent
  def self.call(admission:, group:, actor:)
    admission.with_lock do
      raise ArgumentError, "El ciclo escolar está cerrado" if admission.academic_year.closed_for_academics?
      raise ArgumentError, "La solicitud ya fue formalizada o no está aprobada" unless admission.status == "approved" && !admission.enrollment
      admission.student.with_lock do
        admission.errors.clear
        raise ArgumentError, "Expediente incompleto" unless admission.complete_for_enrollment?
        admission.eligible_history
        raise ActiveRecord::RecordInvalid, admission if admission.errors.any?
        group.with_lock do
          raise ArgumentError, "El grupo no tiene cupo" if group.enrollments.count >= group.capacity
          enrollment = Enrollment.create!(admission: admission, student: admission.student,
            academic_year: admission.academic_year, group: group)
          AuditEvent.create!(user: actor, action: "admission.formalized", record_type: "Admission", record_id: admission.id)
          enrollment
        end
      end
    end
  end
end
