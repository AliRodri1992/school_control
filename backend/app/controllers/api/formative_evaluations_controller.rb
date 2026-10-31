module Api
  class FormativeEvaluationsController < ApplicationController
    before_action :require_educator, only: :create
    before_action :require_admin, only: :publish

    def index
      enrollment = access.enrollments.find(params.require(:enrollment_id))
      render json: enrollment.formative_evaluations.order(:field_code, :term).map { |record| present_record(record) }
    end

    def create
      enrollment = access.enrollments.find(params.require(:enrollment_id))
      enrollment.with_lock do
        record = enrollment.formative_evaluations.find_or_initialize_by(
          field_code: params.require(:field_code), term: params.require(:term))
        raise ArgumentError, "La evaluación publicada no puede modificarse" if record.persisted? && record.status == "published"
        record.assign_attributes(params.permit(:score, :feedback).merge(status: "draft"))
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
    end

    private

    def permission_key
      action_name == "publish" ? "grades.publish" : action_name == "create" ? "grades.create" : "grades.index"
    end

    def present_record(record)
      record.as_json.merge(field_name: FormativeEvaluation::FIELDS.fetch(record.field_code).fetch(:name))
    end
  end
end
