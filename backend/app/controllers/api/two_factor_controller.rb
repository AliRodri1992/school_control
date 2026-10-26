module Api
  class TwoFactorController < ApplicationController
    rate_limit to: 10, within: 15.minutes

    def show
      render json: { enabled: current_user.totp_credential&.enabled? || false }
    end

    def setup
      verify_current_password!
      credential = TotpCredential.create_for!(current_user)
      render json: {
        enabled: false, secret: credential.secret,
        provisioning_uri: TotpAuthenticator.uri(credential.secret, current_user.email)
      }
    end

    def confirm
      credential = current_user.totp_credential
      unless credential && !credential.enabled?
        return render json: { error: "Primero configura tu aplicación de autenticación." },
          status: :unprocessable_content
      end

      codes = credential.activate!(params.require(:code))
      current_user.login_sessions.active.where.not(
        token_digest: Digest::SHA256.hexdigest(session[:login_token].to_s)
      ).update_all(revoked_at: Time.current)
      audit(current_user, "user.two_factor_enabled")
      render json: { enabled: true, recovery_codes: codes }
    end

    def destroy
      verify_current_password!
      credential = current_user.totp_credential
      unless credential&.enabled? && credential.verify!(params.require(:code))
        return render json: { error: "El código de autenticación es incorrecto." },
          status: :unprocessable_content
      end

      credential.destroy!
      current_user.revoke_sessions!
      audit(current_user, "user.two_factor_disabled")
      reset_session
      render json: { message: "Verificación en dos pasos desactivada. Inicia sesión de nuevo.",
        csrf_token: form_authenticity_token }
    end

    private

    def verify_current_password!
      raise ArgumentError, "La contraseña actual es incorrecta." unless
        current_user.authenticate(params[:current_password].to_s)
    end
  end
end
