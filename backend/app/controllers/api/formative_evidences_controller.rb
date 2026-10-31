module Api
  class FormativeEvidencesController < ApplicationController
    def index
      enrollment = access.enrollments.find(params.require(:enrollment_id))
      records = enrollment.formative_evidences.order(:term, :field_code, :created_at)
      render json: records.map { |record| present_evidence(record) }
    end

    def create
      enrollment = access.enrollments.find(params.require(:enrollment_id))
      record = enrollment.formative_evidences.new(attributes)
      record.author = current_user
      record.save!
      audit(record, "formative_evidence.created")
      render json: present_evidence(record), status: :created
    end

    def update
      record = scoped_record
      record.update!(attributes)
      audit(record, "formative_evidence.updated")
      render json: present_evidence(record)
    end

    def destroy
      record = scoped_record
      record.destroy!
      audit(record, "formative_evidence.deleted")
      head :no_content
    end

    private

    def permission_key = action_name == "index" ? "grades.index" : "grades.create"

    def scoped_record
      FormativeEvidence.where(enrollment_id: access.enrollments.select(:id)).find(params[:id])
    end

    def attributes
      params.permit(:field_code, :term, :kind, :title, :score, :weight, :feedback)
    end

    def present_evidence(record)
      record.as_json.merge(reference: FormativeEvidence.reference(
        record.enrollment.formative_evidences.where(field_code: record.field_code, term: record.term).to_a,
        rounding: record.enrollment.academic_year.average_decimal_mode))
    end
  end
end
