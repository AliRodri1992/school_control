module Api
  class LanguagesController < ApplicationController
    skip_before_action :authorize_permission
    before_action :require_translator, only: %i[create update]

    def index
      scope = SchoolAccess.new(current_user, "access_roles.update").institution? ? Language.all : Language.active
      render json: scope.order(:code).as_json(only: %i[id code name native_name text_direction status])
    end

    def create
      language = Language.create!(params.permit(:code, :name, :native_name, :text_direction, :status))
      render json: present(language), status: :created
    end

    def update
      language = Language.find(params[:id])
      language.update!(params.permit(:name, :native_name, :text_direction, :status))
      render json: present(language)
    end

    def bundle
      language = Language.active.find(params[:id])
      render json: { locale: language.code, text_direction: language.text_direction,
        translations: language.translation_entries.published.order(:key).pluck(:key, :text).to_h }
    end

    private

    def require_translator
      return if SchoolAccess.new(current_user, "access_roles.update").institution?
      render json: { error: "No tienes permiso para administrar idiomas" }, status: :forbidden
    end
  end
end
