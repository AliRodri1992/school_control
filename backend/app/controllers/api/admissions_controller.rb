module Api
  class AdmissionsController < ApplicationController
    after_action :verify_policy_scoped, only: :index
    after_action :verify_authorized, except: :index
    before_action :require_admin, only: %i[approve reject request_corrections formalize]

    def index
      render json: policy_scope(Admission).includes(:student, :academic_year).order(created_at: :desc).map { |record| present(record) }
    end

    def create
      student = students_scope.find(params.require(:student_id))
      admission = student.admissions.new(params.permit(:academic_year_id, :grade_level, :kind))
      admission.status = 'draft' if params[:draft] == true
      authorize admission, :create?
      admission.transaction do
        admission.save!
        audit(admission, "admission.created")
      end
      render json: present(admission), status: :created
    end

    def submit
      admission = Admission.find(params[:id])
      authorize admission, :create?
      admission.with_lock do
        raise ArgumentError, "Solo puede enviar un borrador o una corrección" unless %w[draft correction_requested].include?(admission.status)
        raise ArgumentError, "Complete domicilio, teléfono y contacto familiar antes de enviar" unless admission.complete_for_submission?
        admission.eligible_history
        raise ActiveRecord::RecordInvalid, admission if admission.errors.any?
        admission.update!(status: "submitted", reason: nil)
        audit(admission, "admission.submitted")
      end
      render json: present(admission)
    end

    def request_corrections
      admission = Admission.find(params[:id])
      authorize admission, :reject?
      admission.with_lock do
        raise ArgumentError, "La solicitud no está en revisión" unless admission.status == "submitted"
        raise ArgumentError, "Indique las correcciones necesarias" if params[:reason].blank?
        admission.update!(status: "correction_requested", reason: params[:reason])
        audit(admission, "admission.correction_requested")
      end
      render json: present(admission)
    end

    def approve
      admission = Admission.find(params[:id])
      authorize admission, :approve?
      admission.with_lock do
        raise ArgumentError, "La solicitud no está en revisión" unless admission.status == "submitted"
        raise ArgumentError, "Expediente incompleto" unless admission.complete_for_submission?
        admission.update!(status: "approved", reason: nil)
        audit(admission, "admission.approved")
      end
      render json: present(admission)
    end

    def formalize
      admission = Admission.find(params[:id])
      authorize admission, :approve?
      enrollment = AdmitStudent.call(admission: admission, group: Group.find(params.require(:group_id)), actor: current_user)
      render json: present(enrollment), status: :created
    end

    def reject
      admission = Admission.find(params[:id])
      authorize admission, :reject?
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
