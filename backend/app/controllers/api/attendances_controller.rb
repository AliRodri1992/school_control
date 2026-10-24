module Api
  class AttendancesController < ApplicationController
    after_action :verify_policy_scoped, only: :index
    after_action :verify_authorized, except: :index
    before_action :require_educator, only: :create

    def index
      render json: policy_scope(Attendance).includes(enrollment: :student).order(on: :desc).map { |record| present(record) }
    end

    def create
      enrollment = enrollments_scope.find(params.require(:enrollment_id))
      enrollment.with_lock do
        attendance = enrollment.attendances.find_or_initialize_by(on: params.require(:on))
        authorize attendance, :create?
        attendance.update!(params.permit(:status, :notes))
        audit(attendance, "attendance.saved")
        render json: present(attendance)
      end
    end
  end
end
