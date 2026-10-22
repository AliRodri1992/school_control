module Api
  class SessionsController < ApplicationController
    skip_before_action :require_user
    rate_limit to: 10, within: 3.minutes, only: %i[create register], with: -> { render json: { error: "Demasiados intentos; espera unos minutos" }, status: :too_many_requests }

    def show
      render json: { user: current_user && present(current_user), csrf_token: form_authenticity_token }
    end

    def create
      user = User.find_by(email: params[:email].to_s.strip.downcase, active: true)
      if user&.authenticate(params[:password].to_s)
        reset_session
        session[:user_id] = user.id
        session[:session_version] = user.session_version
        show
      else
        render json: { error: "Correo o contraseña incorrectos" }, status: :unauthorized
      end
    end

    def register
      user = User.create!(params.permit(:name, :email, :password, :password_confirmation).merge(role: "guardian"))
      reset_session
      session[:user_id] = user.id
      session[:session_version] = user.session_version
      show
    end

    def destroy
      reset_session
      show
    end
  end
end
