module Api
  class DocsController < ApplicationController
    skip_before_action :authorize_permission
    before_action :require_docs_permission

    def show
      render json: JSON.parse(Rails.root.join("openapi/v1.json").read)
    end

    private

    def require_docs_permission
      return if current_user.can?("access_roles.index")
      render json: { error: "No tienes permiso para consultar la documentación API" }, status: :forbidden
    end
  end
end
