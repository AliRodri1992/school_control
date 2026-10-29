class AdmitStudent
  def self.call(admission:, group:, actor:)
    admission.with_lock do
      raise ArgumentError, "La solicitud ya fue resuelta" unless admission.status == "approved"
      admission.student.with_lock do
        admission.errors.clear
        raise ArgumentError, "Expediente incompleto" unless admission.complete_for_submission?
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
