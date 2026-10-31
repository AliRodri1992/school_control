module Api
  class EnrollmentsController < ApplicationController
    after_action :verify_policy_scoped, only: :index
    after_action :verify_authorized, except: :index
    before_action :require_admin, only: :complete

    def index
      render json: policy_scope(Enrollment).includes(:student, group: :academic_year).order(:id).map { |record| present(record) }
    end

    def complete
      enrollment = Enrollment.find(params[:id])
      authorize enrollment, :complete?
      CompleteEnrollment.call(enrollment: enrollment, outcome: params.require(:outcome), actor: current_user, reason: params[:reason])
      render json: present(enrollment)
    end
  end
end
