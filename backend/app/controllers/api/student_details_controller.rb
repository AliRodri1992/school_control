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
      "contacts" => %i[name first_name middle_name paternal_surname maternal_surname curp legacy_phone relationship email emergency pickup_authorized primary priority],
      "notes" => %i[body category visibility]
    }.freeze

    def index
      scope = visible_records
      unless params[:page].present?
        render json: scope.order(created_at: :desc).limit(100).map { |record| serialize(record) }
        return
      end

      scope = apply_list_filters(scope)
      per_page = permitted_page_size
      total = scope.count
      total_pages = [ (total.to_f / per_page).ceil, 1 ].max
      page = [ params[:page].to_i.clamp(1, 10_000), total_pages ].min
      direction = params[:sort] == "oldest" ? :asc : :desc
      records = scope.order(created_at: direction, id: direction).offset((page - 1) * per_page).limit(per_page)
      render json: {
        items: records.map { |record| serialize(record) },
        total: total, page: page, per_page: per_page, total_pages: total_pages
      }
    end

    def show
      raise ArgumentError, "Tipo de información no permitido" unless resource == "contacts"

      render json: serialize(collection.find(params[:id]))
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

    LIST_SEARCH_COLUMNS = {
      "addresses" => %w[line1 line2 neighborhood locality region postal_code country_code],
      "phones" => %w[number_e164 extension country_code],
      "contacts" => %w[name first_name middle_name paternal_surname maternal_surname curp legacy_phone relationship email],
      "notes" => %w[body category]
    }.freeze

    def permitted_page_size
      [ 8, 16, 24 ].include?(params[:per_page].to_i) ? params[:per_page].to_i : 8
    end

    def apply_list_filters(scope)
      search = params[:q].to_s.strip
      if search.present?
        table = scope.klass.arel_table
        escaped = ActiveRecord::Base.sanitize_sql_like(search)
        predicates = LIST_SEARCH_COLUMNS.fetch(resource).map do |column|
          table[column].matches("%#{escaped}%")
        end
        scope = scope.where(predicates.reduce(&:or))
      end

      kind = params[:type].to_s
      valid_types = case resource
      when "addresses" then %w[home fiscal other]
      when "phones" then %w[mobile home work emergency]
      when "notes" then %w[internal shared]
      else []
      end
      if valid_types.include?(kind)
        scope = scope.where(resource == "notes" ? { visibility: kind } : { purpose: kind })
      end

      flag = params[:flag].to_s
      allowed_flags = resource == "contacts" ? %w[primary emergency pickup_authorized] :
        %w[addresses phones].include?(resource) ? %w[primary] : []
      if allowed_flags.include?(flag)
        scope = case flag
        when "primary" then scope.where(primary: true)
        when "emergency" then scope.where(emergency: true)
        when "pickup_authorized" then scope.where(pickup_authorized: true)
        end
      end
      scope
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
      permission = %w[index show].include?(action_name) ? "students.show" : "students.update"
      @student = SchoolAccess.new(current_user, permission).students.find(params[:student_id])
    end

    def authorize_student
      authorize @student, %w[index show].include?(action_name) ? :show? : :update?
      return unless resource == "notes" && action_name != "index"
      return if institutional_student_access?
      raise Pundit::NotAuthorizedError, "Las notas internas requieren acceso administrativo"
    end

    def serialize(record)
      fields = record.as_json(except: %i[addressable_type addressable_id phoneable_type phoneable_id
        contactable_type contactable_id notable_type notable_id])
      fields.except!("birth_date", "sex") if resource == "contacts"
      fields.merge("id" => record.id)
    end
  end
end
