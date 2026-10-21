module Api
  class EnrollmentsController < ApplicationController
    before_action :require_admin, only: :complete

    def index
      render json: enrollments_scope.includes(:student, group: :academic_year).order(:id).map { |record| present(record) }
    end

    def complete
      enrollment = Enrollment.find(params[:id])
      CompleteEnrollment.call(enrollment: enrollment, outcome: params.require(:outcome), actor: current_user)
      render json: present(enrollment)
    end
  end
end
