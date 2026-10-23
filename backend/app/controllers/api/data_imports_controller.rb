module Api
  class DataImportsController < ApplicationController
    skip_before_action :authorize_permission
    before_action :require_school_importer

    def index
      render json: current_user.data_imports.order(created_at: :desc).limit(30).map { |item| present_import(item) }
    end

    def create
      batch = current_user.data_imports.new(kind: "students", file: params.require(:file))
      batch.save!
      render json: present_import(batch), status: :created
    end

    def show
      render json: present_import(batch)
    end

    def preview
      dataset = DataImportReader.new(batch).call
      render json: { headers: dataset[:headers], sample: dataset[:rows].first(5).map { |number, data| { row: number, values: data } },
        suggested_mapping: ValidateStudentImport.new(batch).suggest(dataset[:headers]),
        total_rows: dataset[:rows].size }
    end

    def validate
      permitted = params.require(:mapping).to_unsafe_h.stringify_keys
      result = ValidateStudentImport.new(batch).call(permitted)
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
      return if SchoolAccess.new(current_user, "students.create").institution? && current_user.can?("users.index")
      render json: { error: "Sin permiso para importar alumnos" }, status: :forbidden
    end

    def present_import(item)
      item.as_json(only: %i[id kind status mapping row_errors total_rows imported_rows created_at updated_at])
    end
  end
end
