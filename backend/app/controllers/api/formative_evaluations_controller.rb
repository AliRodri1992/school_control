module Api
  class FormativeEvaluationsController < ApplicationController
    before_action :require_educator, only: :create
    before_action :require_admin, only: %i[publish correct]

    def index
      enrollment = access.enrollments.find(params.require(:enrollment_id))
      records = enrollment.formative_evaluations
      records = records.published unless access.educator?
      render json: records.order(:field_code, :term).map { |record| present_record(record) }
    end

    def summary
      enrollment = access.enrollments.find(params.require(:enrollment_id))
      render json: PrimarySchoolGrading.report(enrollment: enrollment)
    end

    def create
      enrollment = access.enrollments.find(params.require(:enrollment_id))
      enrollment.with_lock do
        record = enrollment.formative_evaluations.find_or_initialize_by(
          field_code: params.require(:field_code), term: params.require(:term))
        raise ArgumentError, "La evaluación publicada no puede modificarse" if record.persisted? && record.status == "published"
        record.assign_attributes(params.permit(:score, :feedback, :source_kind, :source_school, :source_document_ref).merge(status: "draft"))
        record.save!
        audit(record, "formative_evaluation.saved")
        render json: present_record(record)
      end
    end

    def publish
      enrollment = access.enrollments.find_by!(id: FormativeEvaluation.find(params[:id]).enrollment_id)
      enrollment.with_lock do
        record = enrollment.formative_evaluations.find(params[:id])
        raise ArgumentError, "La evaluación ya está publicada" if record.status == "published"
        record.update!(status: "published", reviewer: current_user, published_at: Time.current)
        audit(record, "formative_evaluation.published")
        render json: present_record(record)
      end
      AcademicYearLifecycle.advance!(enrollment.academic_year, trigger: "formative_evaluation_published")
    end

    def correct
      record = FormativeEvaluation.find(params[:id])
      enrollment = access.enrollments.find(record.enrollment_id)
      enrollment.with_lock do
        record.reload
        raise ArgumentError, "Solo se pueden rectificar evaluaciones publicadas" unless record.status == "published"
        raise ArgumentError, "La evaluación cambió; actualiza la pantalla" unless record.lock_version == Integer(params.require(:lock_version))
        reason = params.require(:reason).to_s.strip
        raise ArgumentError, "La rectificación requiere un motivo de 10 a 2000 caracteres" unless (10..2000).cover?(reason.length)
        previous = { score: record.score, feedback: record.feedback }
        record.correction_authorized = true
        record.assign_attributes(params.permit(:score, :feedback))
        raise ArgumentError, "No hay cambios para rectificar" unless record.changed?
        record.save!
        AuditEvent.create!(user: current_user, action: "formative_evaluation.corrected",
          record_type: "FormativeEvaluation", record_id: record.id,
          changes_summary: { previous: previous, current: { score: record.score, feedback: record.feedback },
            reason: reason, academic_year_id: enrollment.academic_year_id })
        render json: present_record(record)
      ensure
        record.correction_authorized = false
      end
    end

    private

    def permission_key
      return "grades.correct" if action_name == "correct"
      action_name == "publish" ? "grades.publish" : action_name == "create" ? "grades.create" : "grades.index"
    end

    def present_record(record)
      record.as_json.merge(field_name: FormativeEvaluation::FIELDS.fetch(record.field_code).fetch(:name))
    end
  end
end
