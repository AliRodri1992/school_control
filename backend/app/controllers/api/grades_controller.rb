module Api
  class GradesController < ApplicationController
    before_action :require_educator, only: %i[create history]

    before_action :require_admin, only: %i[review publish correct]

    def index
      scope = access.grades
      render json: scope.includes(:course, enrollment: :student).order(:term, :id).map { |record| present(record) }
    end

    def create
      course = courses_scope.find(params.require(:course_id))
      enrollment = enrollments_scope.where(group_id: course.group_id).find(params.require(:enrollment_id))
      enrollment.with_lock do
        grade = enrollment.grades.find_or_initialize_by(course: course, term: params.require(:term))
        raise ArgumentError, "Esta calificación está publicada. Solicita una corrección administrativa." if grade.status == "published"
        grade.update!(params.permit(:score, :feedback).merge(status: "draft", reviewer: nil, reviewed_at: nil))
        audit(grade, "grade.saved")
        render json: present(grade)
      end
    end
    def review
      render json: present(GradeWorkflow.review(grade: find_grade, actor: current_user))
    end

    def publish
      render json: present(GradeWorkflow.publish(grade: find_grade, actor: current_user))
    end

    def correct
      grade = GradeWorkflow.correct(grade: find_grade, actor: current_user,
        attributes: params.permit(:score, :feedback).to_h.symbolize_keys, reason: params.permit(:reason)[:reason], expected_version: params.require(:lock_version))
      render json: present(grade)
    end

    def history
      grade = find_grade
      render json: grade.corrections.includes(:actor).order(created_at: :desc, id: :desc).map { |correction|
        correction.as_json(only: %i[id previous_score score previous_feedback feedback reason created_at]).merge(actor_name: correction.actor.name)
      }
    end

    private

    def find_grade
      scope = access.grades
      scope.find(params[:id])
    end
  end
end
