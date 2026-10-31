module Api
  class StudentContactsController < ApplicationController
    after_action :verify_policy_scoped, only: :index
    after_action :verify_authorized, except: :index
    before_action :require_family_or_admin

    def index
      render json: policy_scope(StudentContact).includes(:student).order(:name).map { |record| serialize(record) }
    end

    def create
      student = students_scope.find(params.require(:student_id))
      record = student.student_contacts.new(attributes)
      authorize record, :create?
      record.transaction do
        record.save!
        audit(record, "contact.created")
      end
      render json: serialize(record), status: :created
    end

    def update
      record = collection.find(params[:id])
      authorize record, :update?
      record.with_lock do
        record.update!(attributes)
        audit(record, "contact.updated")
      end
      render json: serialize(record)
    end

    def destroy
      record = collection.find(params[:id])
      authorize record, :destroy?
      record.transaction do
        audit(record, "contact.deleted")
        record.destroy!
      end
      head :no_content
    end

    private

    def require_family_or_admin
      authorize_permission
    end

    def collection = StudentContact.where(student_id: students_scope.select(:id))
    def attributes = params.permit(:name, :relationship, :phone, :email, :emergency, :pickup_authorized,
      :first_name, :middle_name, :paternal_surname, :maternal_surname, :curp)
    # CURP-derived data is internal; clients may neither submit nor overwrite it.
    def serialize(record) = record.as_json(except: %i[birth_date sex]).merge(student_name: record.student.full_name)
  end
end
