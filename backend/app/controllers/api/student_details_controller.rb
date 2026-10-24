module Api
  class StudentDetailsController < ApplicationController
    skip_before_action :authorize_permission
    before_action :load_student
    before_action :authorize_student

    RESOURCES = {
      "addresses" => :addresses, "phones" => :phone_numbers,
      "contacts" => :contacts, "notes" => :notes
    }.freeze

    ATTRIBUTES = {
      "addresses" => %i[country_code purpose primary line1 line2 neighborhood locality region postal_code latitude longitude],
      "phones" => %i[number_e164 country_code purpose extension primary],
      "contacts" => %i[name relationship email emergency pickup_authorized primary priority],
      "notes" => %i[body category visibility]
    }.freeze

    def index
      render json: visible_records.order(created_at: :desc).limit(100).map { |record| serialize(record) }
    end

    def create
      record = collection.new(record_attributes)
      record.author = current_user if resource == "notes"
      record.visibility = "internal" if resource == "notes"
      record.transaction do
        record.save!
        audit(record, "#{record.class.name.underscore}.created")
      end
      render json: serialize(record), status: :created
    end

    def update
      record = collection.find(params[:id])
      record.with_lock do
        record.update!(record_attributes)
        audit(record, "#{record.class.name.underscore}.updated")
      end
      render json: serialize(record)
    end

    def destroy
      record = collection.find(params[:id])
      record.transaction do
        audit(record, "#{record.class.name.underscore}.deleted")
        record.destroy!
      end
      head :no_content
    end

    private

    def resource
      requested = params[:kind].to_s
      raise ArgumentError, "Tipo de información no permitido" unless RESOURCES.key?(requested)
      requested
    end

    def collection
      @student.public_send(RESOURCES.fetch(resource))
    end

    def visible_records
      return collection unless resource == "notes" && !institutional_student_access?
      collection.where(visibility: "shared")
    end

    def record_attributes
      attributes = params.permit(*ATTRIBUTES.fetch(resource))
      if resource == "notes"
        attributes.delete(:visibility)
      end
      attributes
    end

    def institutional_student_access?
      SchoolAccess.new(current_user, "students.update").institution?
    end

    def load_student
      permission = action_name == "index" ? "students.show" : "students.update"
      @student = SchoolAccess.new(current_user, permission).students.find(params[:student_id])
    end

    def authorize_student
      authorize @student, action_name == "index" ? :show? : :update?
      return unless resource == "notes" && action_name != "index"
      return if institutional_student_access?
      raise Pundit::NotAuthorizedError, "Las notas internas requieren acceso administrativo"
    end

    def serialize(record)
      fields = record.as_json(except: %i[addressable_type addressable_id phoneable_type phoneable_id
        contactable_type contactable_id notable_type notable_id])
      fields.merge("id" => record.id)
    end
  end
end
