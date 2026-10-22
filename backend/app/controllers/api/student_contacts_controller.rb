module Api
  class StudentContactsController < ApplicationController
    before_action :require_family_or_admin

    def index
      render json: collection.includes(:student).order(:name).map { |record| serialize(record) }
    end

    def create
      student = students_scope.find(params.require(:student_id))
      record = student.student_contacts.new(attributes)
      record.transaction do
        record.save!
        audit(record, "contact.created")
      end
      render json: serialize(record), status: :created
    end

    def update
      record = collection.find(params[:id])
      record.with_lock do
        record.update!(attributes)
        audit(record, "contact.updated")
      end
      render json: serialize(record)
    end

    def destroy
      record = collection.find(params[:id])
      record.transaction do
        audit(record, "contact.deleted")
        record.destroy!
      end
      head :no_content
    end

    private

    def require_family_or_admin
      head :forbidden unless current_user.admin? || current_user.guardian?
    end

    def collection = StudentContact.where(student_id: students_scope.select(:id))
    def attributes = params.permit(:name, :relationship, :phone, :email, :emergency, :pickup_authorized)
    def serialize(record) = record.as_json.merge(student_name: record.student.full_name)
  end
end
