module Api
  class ProfilesController < ApplicationController
    def show
      render json: present(current_user).merge(email_notifications: current_user.email_notifications)
    end

    def update
      changes = params.permit(:name, :email_notifications)
      changes[:name] = changes[:name].to_s.strip if changes.key?(:name)
      current_user.update!(changes)
      show
    end
  end
end
