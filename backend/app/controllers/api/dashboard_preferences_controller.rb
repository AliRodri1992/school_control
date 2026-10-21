module Api
  class DashboardPreferencesController < ApplicationController
    def show
      preference = DashboardPreference.find_by(user: current_user)
      render json: { configuration: preference&.configuration, lock_version: preference&.lock_version }
    end

    def update
      preference = DashboardPreference.find_or_initialize_by(user: current_user)
      if preference.persisted? && params[:lock_version] != preference.lock_version
        return render json: { error: "El dashboard cambió en otra sesión. Recarga antes de guardar." }, status: :conflict
      end
      preference.configuration = params.require(:configuration).permit!.to_h
      preference.save!
      render json: { configuration: preference.configuration, lock_version: preference.lock_version }
    rescue ActiveRecord::StaleObjectError, ActiveRecord::RecordNotUnique
      render json: { error: "El dashboard cambió en otra sesión. Recarga antes de guardar." }, status: :conflict
    end
  end
end
