module Api
  class TranslationEntriesController < ApplicationController
    skip_before_action :authorize_permission
    before_action :require_translator

    def index
      scope = TranslationEntry.includes(:language).order(:key)
      scope = scope.where(language_id: params[:language_id]) if params[:language_id].present?
      render json: scope.limit(300).as_json(only: %i[id language_id key text status reviewer_id published_at])
    end

    def create
      entry = TranslationEntry.new(params.permit(:language_id, :key, :text, :status))
      stamp_review(entry)
      entry.save!
      render json: present(entry), status: :created
    end

    def update
      entry = TranslationEntry.find(params[:id])
      entry.assign_attributes(params.permit(:text, :status))
      stamp_review(entry)
      entry.save!
      render json: present(entry)
    end

    private

    def stamp_review(entry)
      return unless entry.status == "published"
      entry.reviewer = current_user
      entry.published_at = Time.current
    end

    def require_translator
      return if SchoolAccess.new(current_user, "access_roles.update").institution?
      render json: { error: "No tienes permiso para gestionar traducciones" }, status: :forbidden
    end
  end
end
