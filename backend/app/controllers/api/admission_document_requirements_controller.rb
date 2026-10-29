module Api
  class AdmissionDocumentRequirementsController < ApplicationController
    def permission_key
      action_name == "index" ? "admissions.index" : "admissions.approve"
    end

    def index
      scope = AdmissionDocumentRequirement.order(:grade_level, :title)
      scope = scope.where(academic_year_id: params[:academic_year_id]) if params[:academic_year_id].present?
      scope = scope.where(grade_level: params[:grade_level]) if params[:grade_level].present?
      render json: scope.as_json(only: %i[id academic_year_id grade_level title required_for_submission required_for_formalization])
    end

    def create
      ensure_admin
      record = AdmissionDocumentRequirement.create!(params.permit(:academic_year_id, :grade_level,
        :title, :required_for_submission, :required_for_formalization))
      render json: record, status: :created
    end

    def destroy
      ensure_admin
      AdmissionDocumentRequirement.find(params[:id]).destroy!
      head :no_content
    end

    private

    def ensure_admin
      raise Pundit::NotAuthorizedError unless SchoolAccess.new(current_user, "admissions.approve").institution?
    end
  end
end
