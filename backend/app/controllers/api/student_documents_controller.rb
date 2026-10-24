module Api
  class StudentDocumentsController < ApplicationController
    after_action :verify_policy_scoped, only: :index
    after_action :verify_authorized, except: :index
    before_action :require_family_or_admin
    before_action :require_admin, only: :review
    rescue_from ActiveRecord::StaleObjectError, with: -> { render json: { error: "El documento cambió. Actualiza la lista." }, status: :conflict }

    def index
      render json: policy_scope(StudentDocument).includes(:student, file_attachment: :blob).order(created_at: :desc).map { |record| serialize(record) }
    end

    def create
      student = students_scope.find(params.require(:student_id))
      upload = params.require(:file)
      record = StudentDocument.new(student: student, uploader: current_user, title: params[:title])
      authorize record, :create?
      unless valid_upload?(upload)
        return render json: { error: "Adjunta un PDF, PNG o JPG válido de hasta 10 MB." }, status: :unprocessable_content
      end
      record.file.attach(io: upload.tempfile, filename: upload.original_filename, content_type: Marcel::MimeType.for(upload.tempfile))
      record.transaction do
        record.save!
        audit(record, "document.uploaded")
      end
      render json: serialize(record.reload), status: :created
    end

    def download
      record = collection.find(params[:id])
      authorize record, :download?
      audit(record, "document.downloaded")
      response.headers["Cache-Control"] = "private, no-store"
      response.headers["X-Content-Type-Options"] = "nosniff"
      send_data record.file.download, filename: record.file.filename.to_s, type: "application/octet-stream", disposition: "attachment"
    end

    def review
      record = collection.find(params[:id])
      authorize record, :review?
      unless %w[approved correction_requested].include?(params[:status])
        return render json: { error: "Selecciona un resultado de revisión" }, status: :unprocessable_content
      end
      record.transaction do
        record.update!(status: params[:status], review_notes: params[:review_notes], lock_version: params.require(:lock_version), reviewer: current_user, reviewed_at: Time.current)
        audit(record, "document.reviewed")
      end
      render json: serialize(record)
    end

    private

    def require_family_or_admin
      authorize_permission
    end

    def collection = StudentDocument.where(student_id: students_scope.select(:id))

    def valid_upload?(upload)
      return false unless upload.respond_to?(:tempfile) && upload.size.positive? && upload.size <= 10.megabytes
      %w[application/pdf image/png image/jpeg].include?(Marcel::MimeType.for(upload.tempfile))
    end

    def serialize(record)
      record.as_json(only: %i[id student_id title status review_notes reviewed_at lock_version created_at]).merge(
        student_name: record.student.full_name, filename: record.file.filename.to_s,
        download_url: download_api_student_document_path(record))
    end
  end
end
