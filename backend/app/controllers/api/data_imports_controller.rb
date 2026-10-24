module Api
  class DataImportsController < ApplicationController
    skip_before_action :authorize_permission
    before_action :require_school_importer

    def index
      render json: current_user.data_imports.order(created_at: :desc).limit(30).map { |item| present_import(item) }
    end

    def create
      batch = current_user.data_imports.new(kind: params[:kind].presence || "students", file: params.require(:file))
      batch.save!
      render json: present_import(batch), status: :created
    end

    def show
      render json: present_import(batch)
    end

    def preview
      dataset = DataImportReader.new(batch).call
      render json: { headers: dataset[:headers], sample: dataset[:rows].first(5).map { |number, data| { row: number, values: data } },
        suggested_mapping: validator.suggest(dataset[:headers]),
        total_rows: dataset[:rows].size }
    end

    def validate
      permitted = params.require(:mapping).to_unsafe_h.stringify_keys
      result = validator.call(permitted)
      batch.update!(mapping: permitted, status: result[:errors].empty? ? "validated" : "uploaded",
        total_rows: result[:total_rows], row_errors: result[:errors])
      render json: present_import(batch)
    end

    def execute
      batch.with_lock do
        raise ArgumentError, "La importación debe validarse antes de ejecutar" unless batch.status == "validated"
        batch.update!(status: "queued")
      end
      DataImportJob.perform_later(batch.id)
      render json: present_import(batch), status: :accepted
    end

    private

    def batch = @batch ||= current_user.data_imports.find(params[:id])

    def require_school_importer
      requested_kind = params[:id] ? batch.kind : params[:kind].presence || "students"
      if action_name == "index"
        return if import_permissions.any? { |permission| SchoolAccess.new(current_user, permission).institution? }
        return render json: { error: "Sin permiso para consultar importaciones" }, status: :forbidden
      end
      permission = {
        "students" => "students.create", "subjects" => "subjects.create",
        "groups" => "groups.create", "teachers" => "users.create", "tutors" => "users.create"
      }[requested_kind]
      if %w[teachers tutors].include?(requested_kind) && !current_user.can?("access_roles.assign")
        return render json: { error: "Sin permiso para asignar roles" }, status: :forbidden
      end
      return if permission && SchoolAccess.new(current_user, permission).institution?
      render json: { error: "Sin permiso para importar estos datos" }, status: :forbidden
    end

    def import_permissions
      %w[students.create subjects.create groups.create users.create]
    end

    def validator
      case batch.kind
      when "students" then ValidateStudentImport.new(batch)
      when "teachers", "tutors" then ValidateUserImport.new(batch)
      else ValidateCatalogImport.new(batch)
      end
    end

    def present_import(item)
      item.as_json(only: %i[id kind status mapping row_errors total_rows imported_rows created_at updated_at])
    end
  end
end
