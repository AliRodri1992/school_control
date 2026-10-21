module Api
  class GradesController < ApplicationController
    before_action :require_educator, only: :create

    def index
      scope = Grade.where(enrollment: enrollments_scope)
      scope = scope.where(course: current_user.courses) if current_user.teacher?
      render json: scope.includes(:course, enrollment: :student).order(:term, :id).map { |record| present(record) }
    end

    def create
      course = courses_scope.find(params.require(:course_id))
      enrollment = enrollments_scope.where(group_id: course.group_id).find(params.require(:enrollment_id))
      enrollment.with_lock do
        grade = enrollment.grades.find_or_initialize_by(course: course, term: params.require(:term))
        grade.update!(params.permit(:score, :feedback))
        audit(grade, "grade.saved")
        render json: present(grade)
      end
    end
  end
end
