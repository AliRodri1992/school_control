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
      @student.with_lock do
        relinquish_primary!(record) if record.respond_to?(:primary?) && record.primary?
        record.save!
        audit(record, "#{record.class.name.underscore}.created")
      end
      render json: serialize(record), status: :created
    end

    def update
      record = collection.find(params[:id])
      @student.with_lock do
        record.reload
        ensure_not_legacy_mirror!(record)
        changes = record_attributes
        relinquish_primary!(record, changes) if changes[:primary] == true ||
          (changes[:primary].to_s == "true")
        record.update!(changes)
        audit(record, "#{record.class.name.underscore}.updated")
      end
      render json: serialize(record)
    end

    def destroy
      record = collection.find(params[:id])
      @student.with_lock do
        record.reload
        ensure_not_legacy_mirror!(record)
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
      attributes
    end

    def ensure_not_legacy_mirror!(record)
      return unless resource == "contacts" && record.legacy_student_contact_id.present?

      raise ArgumentError, "Edita este contacto desde Contactos familiares para conservar la sincronización"
    end

    def relinquish_primary!(record, changes = {})
      purpose = changes[:purpose].presence || record.purpose if record.respond_to?(:purpose)
      previous = collection.where(primary: true)
      previous = previous.where(purpose: purpose) if purpose
      previous = previous.where.not(id: record.id) if record.persisted?
      previous.update_all(primary: false, updated_at: Time.current)
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
