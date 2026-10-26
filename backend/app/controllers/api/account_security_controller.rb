module Api
  class AccountSecurityController < ApplicationController
    rate_limit to: 10, within: 15.minutes

    def update
      current_user.with_lock do
        verify_password!
        current_user.update!(password: params.require(:password), password_confirmation: params.require(:password_confirmation))
        audit(current_user, "user.password_changed")
      end
      reset_session
      render json: { message: "Contraseña actualizada. Vuelve a iniciar sesión.", csrf_token: form_authenticity_token }
    end

    def devices
      current_digest = Digest::SHA256.hexdigest(session[:login_token].to_s)
      render json: { devices: current_user.login_sessions.active.order(last_seen_at: :desc).limit(30).map do |record|
        {
          id: record.id, name: record.browser_label, last_seen_at: record.last_seen_at,
          created_at: record.created_at, current: record.token_digest == current_digest
        }
      end }
    end

    def revoke_device
      verify_password!
      record = current_user.login_sessions.active.find(params[:id])
      current = record.token_digest == Digest::SHA256.hexdigest(session[:login_token].to_s)
      record.update!(revoked_at: Time.current)
      audit(current_user, "user.device_session_revoked")
      if current
        reset_session
        render json: { signed_out: true, message: "Sesión cerrada correctamente.",
          csrf_token: form_authenticity_token }
      else
        render json: { signed_out: false, message: "Se cerró la sesión del dispositivo." }
      end
    end

    def destroy
      current_user.with_lock do
        verify_password!
        current_user.revoke_sessions!
        audit(current_user, "user.sessions_revoked")
      end
      reset_session
      render json: { message: "Todas tus sesiones se cerraron correctamente.", csrf_token: form_authenticity_token }
    end

    private

    def verify_password!
      unless current_user.active? && current_user.session_version == session[:session_version]
        raise ArgumentError, "La sesión expiró. Vuelve a iniciar sesión."
      end
      raise ArgumentError, "La contraseña actual es incorrecta." unless current_user.authenticate(params[:current_password].to_s)
    end
  end
end
