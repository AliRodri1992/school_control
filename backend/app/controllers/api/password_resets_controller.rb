module Api
  class PasswordResetsController < ApplicationController
    skip_before_action :require_user
    rate_limit to: 5, within: 15.minutes, only: :create
    rate_limit to: 10, within: 15.minutes, only: :update

    def create
      user = User.find_by(email: params[:email].to_s.strip.downcase, active: true)
      PasswordRecoveryJob.perform_later(user.id, user.session_version) if user
      render json: { message: "Si existe una cuenta activa con ese correo, recibirás un enlace para restablecer tu contraseña." }, status: :accepted
    end

    def update
      token = params[:token].to_s
      user = User.find_by_token_for(:password_recovery, token)
      raise ArgumentError, "El enlace no es válido o expiró. Solicita uno nuevo." unless user
      user.with_lock do
        unless user.active? && User.find_by_token_for(:password_recovery, token) == user
          raise ArgumentError, "El enlace no es válido o expiró. Solicita uno nuevo."
        end
        user.update!(password: params.require(:password), password_confirmation: params.require(:password_confirmation))
        AuditEvent.create!(user: user, action: "user.password_reset", record_type: "User", record_id: user.id)
      end
      reset_session
      render json: { message: "Contraseña actualizada. Inicia sesión con tu nueva contraseña.", csrf_token: form_authenticity_token }
    end
  end
end
