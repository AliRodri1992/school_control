module Api
  class ProfilesController < ApplicationController
    def show
      render json: present(current_user).merge(email_notifications: current_user.email_notifications)
    end

    def update
      current_user.update!(params.permit(:name, :email_notifications))
      show
    end
  end
end
