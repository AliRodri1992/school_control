module Api
  class AssignmentsController < ApplicationController
    before_action :require_educator, only: %i[create update review]
    rescue_from ActiveRecord::StaleObjectError, with: -> { render json: { error: "El registro cambió. Actualiza antes de guardar." }, status: :conflict }

    def index
      render json: collection.includes(course: :subject).order(:due_at).map { |record| serialize(record) }
    end

    def create
      course = courses_scope.find(params.require(:course_id))
      record = Assignment.new(attributes.merge(course: course))
      record.transaction do
        record.save!
        audit(record, "assignment.created")
      end
      render json: serialize(record), status: :created
    end

    def update
      record = collection.find(params[:id])
      record.transaction do
        record.update!(attributes.merge(lock_version: params.require(:lock_version)))
        audit(record, "assignment.updated")
      end
      render json: serialize(record)
    end

    def submissions
      record = collection.find(params[:id])
      scope = record.assignment_submissions.where(enrollment: enrollments_scope)
      render json: scope.includes(enrollment: :student).map { |submission| serialize_submission(submission) }
    end

    def submit
      return head :forbidden unless current_user.learner?
      record = collection.find(params[:id])
      enrollment = enrollments_scope.where(group_id: record.course.group_id, status: "active").find(params.require(:enrollment_id))
      enrollment.with_lock do
        submission = record.assignment_submissions.find_or_initialize_by(enrollment: enrollment)
        if submission.persisted?
          if submission.reviewed_at
            return render json: { error: "La entrega ya fue revisada" }, status: :conflict
          end
          submission.lock_version = params.require(:lock_version)
        end
        submission.update!(body: params[:body], submitted_at: Time.current)
        audit(submission, "assignment.submitted")
        render json: serialize_submission(submission)
      end
    end

    def review
      record = collection.find(params[:id])
      submission = record.assignment_submissions.find(params.require(:submission_id))
      submission.transaction do
        submission.update!(score: params.require(:score), feedback: params[:feedback], lock_version: params.require(:lock_version), reviewer: current_user, reviewed_at: Time.current)
        audit(submission, "assignment.reviewed")
      end
      render json: serialize_submission(submission)
    end

    private

    def collection
      scope = Assignment.where(course: courses_scope)
      current_user.admin? || current_user.teacher? ? scope : scope.where(published: true)
    end

    def attributes = params.permit(:title, :instructions, :due_at, :published)
    def serialize(record) = record.as_json.merge(course_label: record.course.label)
    def serialize_submission(record) = record.as_json.merge(student_name: record.enrollment.student.full_name, late: record.submitted_at > record.assignment.due_at)
  end
end
