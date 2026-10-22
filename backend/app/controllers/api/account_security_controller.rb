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
