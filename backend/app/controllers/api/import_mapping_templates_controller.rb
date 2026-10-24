module Api
  class ImportMappingTemplatesController < ApplicationController
    skip_before_action :authorize_permission
    before_action :require_importer

    def index
      render json: current_user.import_mapping_templates.where(kind: allowed_kinds).order(:kind, :name)
        .as_json(only: %i[id name kind mapping updated_at])
    end

    def create
      kind = params.require(:kind).to_s
      raise Pundit::NotAuthorizedError unless allowed_kinds.include?(kind)
      item = current_user.import_mapping_templates.create!(params.permit(:name, :kind, mapping: {}).to_h)
      audit(item, "import_mapping_template.created")
      render json: item.as_json(only: %i[id name kind mapping updated_at]), status: :created
    end

    def destroy
      item = current_user.import_mapping_templates.find(params[:id])
      raise Pundit::NotAuthorizedError unless allowed_kinds.include?(item.kind)
      item.transaction do
        audit(item, "import_mapping_template.deleted")
        item.destroy!
      end
      head :no_content
    end

    private

    def allowed_kinds
      {
        "students" => "students.create", "subjects" => "subjects.create",
        "groups" => "groups.create", "grades" => "grades.create",
        "teachers" => "users.create", "tutors" => "users.create"
      }.filter_map do |kind, permission|
        next unless SchoolAccess.new(current_user, permission).institution?
        next if %w[teachers tutors].include?(kind) && !current_user.can?("access_roles.assign")
        kind
      end
    end

    def require_importer
      return if allowed_kinds.any?
      render json: { error: "Sin permisos para administrar plantillas" }, status: :forbidden
    end
  end
end
