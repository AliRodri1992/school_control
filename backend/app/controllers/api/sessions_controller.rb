module Api
  class SessionsController < ApplicationController
    skip_before_action :require_user
    rate_limit to: 10, within: 3.minutes, only: %i[create register verify_otp], with: -> { render json: { error: "Demasiados intentos; espera unos minutos" }, status: :too_many_requests }

    def show
      render json: { user: current_user && present(current_user), csrf_token: form_authenticity_token }
    end

    def create
      user = User.find_by(email: params[:email].to_s.strip.downcase, active: true)
      if user&.authenticate(params[:password].to_s)
        reset_session
        if user.totp_credential&.enabled?
          session[:mfa_pending_user_id] = user.id
          session[:mfa_pending_started_at] = Time.current.to_i
          render json: { mfa_required: true, csrf_token: form_authenticity_token }
        else
          UserLoginSession.issue!(user: user, session: session, request: request)
          show
        end
      else
        render json: { error: "Correo o contraseña incorrectos" }, status: :unauthorized
      end
    end

    def verify_otp
      started = session[:mfa_pending_started_at].to_i
      user = User.find_by(id: session[:mfa_pending_user_id], active: true)
      unless user && started.positive? && Time.current.to_i - started <= 5.minutes.to_i &&
          user.totp_credential&.enabled? && user.totp_credential.verify!(params[:code])
        return render json: { error: "Código de verificación incorrecto o vencido." },
          status: :unprocessable_content
      end
      reset_session
      UserLoginSession.issue!(user: user, session: session, request: request)
      show
    end

    def register
      user = User.create!(params.permit(:name, :email, :password, :password_confirmation).merge(role: "guardian"))
      reset_session
      UserLoginSession.issue!(user: user, session: session, request: request)
      show
    end

    def destroy
      current_login_session&.update!(revoked_at: Time.current)
      reset_session
      show
    end
  end
end
