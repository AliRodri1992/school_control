module Api
  class AdmissionsController < ApplicationController
    before_action :require_admin, only: %i[approve reject]

    def index
      render json: Admission.where(student: students_scope).includes(:student, :academic_year).order(created_at: :desc).map { |record| present(record) }
    end

    def create
      unless current_user.admin? || current_user.guardian?
        return render json: { error: "Solo los tutores o administración pueden solicitar inscripción" }, status: :forbidden
      end
      student = students_scope.find(params.require(:student_id))
      admission = student.admissions.new(params.permit(:academic_year_id, :grade_level, :kind))
      admission.transaction do
        admission.save!
        audit(admission, "admission.created")
      end
      render json: present(admission), status: :created
    end

    def approve
      enrollment = AdmitStudent.call(admission: Admission.find(params[:id]), group: Group.find(params.require(:group_id)), actor: current_user)
      render json: present(enrollment), status: :created
    end

    def reject
      admission = Admission.find(params[:id])
      admission.with_lock do
        raise ArgumentError, "La solicitud ya fue resuelta" unless admission.status == "submitted"
        raise ArgumentError, "Indique el motivo" if params[:reason].blank?
        admission.update!(status: "rejected", reason: params[:reason])
        audit(admission, "admission.rejected")
      end
      render json: present(admission)
    end
  end
end
