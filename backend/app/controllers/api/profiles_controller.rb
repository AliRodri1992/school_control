module Api
  class ProfilesController < ApplicationController
    rate_limit to: 5, within: 15.minutes, only: %i[request_email_change confirm_email_change]
    MAX_AVATAR_SIZE = 2.megabytes
    AVATAR_TYPES = %w[image/png image/jpeg image/webp].freeze

    def show
      render json: profile_data
    end

    def update
      changes = params.permit(:name, :email_notifications)
      changes[:name] = changes[:name].to_s.strip if changes.key?(:name)
      current_user.with_lock do
        current_user.update!(changes)
        update_phone! if params.key?(:phone_e164)
      end
      show
    end

    def avatar
      return head :not_found unless current_user.avatar.attached?

      response.headers["Cache-Control"] = "private, no-store"
      response.headers["X-Content-Type-Options"] = "nosniff"
      send_data current_user.avatar.download, type: current_user.avatar.blob.content_type,
        disposition: "inline"
    end

    def upload_avatar
      file = params.require(:avatar)
      unless file.respond_to?(:tempfile) && file.size.positive? && file.size <= MAX_AVATAR_SIZE &&
          AVATAR_TYPES.include?(Marcel::MimeType.for(file.tempfile))
        return render json: { error: "Selecciona una foto PNG, JPG o WebP de hasta 2 MB." }, status: :unprocessable_content
      end

      current_user.avatar.attach(
        io: file.tempfile, filename: file.original_filename,
        content_type: Marcel::MimeType.for(file.tempfile), identify: false
      )
      audit(current_user, "user.avatar_updated")
      show
    end

    def remove_avatar
      current_user.avatar.purge if current_user.avatar.attached?
      audit(current_user, "user.avatar_removed")
      show
    end


    def request_email_change
      unless current_user.authenticate(params[:current_password].to_s)
        return render json: { error: "La contraseña actual es incorrecta." }, status: :unprocessable_content
      end

      proposed = params.require(:email).to_s.strip.downcase
      unless proposed.match?(URI::MailTo::EMAIL_REGEXP) && proposed != current_user.email &&
          !User.where.not(id: current_user.id).exists?(email: proposed)
        return render json: { error: "Selecciona un correo diferente y disponible." }, status: :unprocessable_content
      end

      token = email_verifier.generate(
        { "user_id" => current_user.id, "old_email" => current_user.email,
          "new_email" => proposed, "session_version" => current_user.session_version },
        expires_in: 15.minutes
      )
      ProfileEmailMailer.with(recipient: current_user, new_email: proposed, token: token).verification.deliver_later
      render json: { message: "Enviamos un enlace de verificación al nuevo correo. Caduca en 15 minutos." },
        status: :accepted
    end

    def confirm_email_change
      info = email_verifier.verified(params.require(:token).to_s)
      unless info.is_a?(Hash) && info["user_id"] == current_user.id &&
          info["old_email"] == current_user.email &&
          info["session_version"] == current_user.session_version
        return render json: { error: "El enlace es inválido o ha caducado." },
          status: :unprocessable_content
      end

      current_user.with_lock do
        current_user.update!(email: info.fetch("new_email"))
        audit(current_user, "user.email_changed")
      end
      reset_session
      render json: { message: "Correo verificado y actualizado. Vuelve a iniciar sesión.",
        csrf_token: form_authenticity_token }
    end

    private

    def email_verifier
      Rails.application.message_verifier(:profile_email_change)
    end

    def personal_phone
      current_user.phone_numbers.find_by(purpose: "mobile", primary: true)
    end

    def update_phone!
      number = params[:phone_e164].to_s.strip
      phone = personal_phone
      if number.blank?
        phone&.destroy!
      elsif phone
        phone.update!(number_e164: number)
      else
        current_user.phone_numbers.create!(purpose: "mobile", number_e164: number, primary: true)
      end
    end

    def profile_data
      present(current_user).merge(
        email_notifications: current_user.email_notifications,
        phone_e164: personal_phone&.number_e164,
        avatar_url: (avatar_api_profile_path if current_user.avatar.attached?),
        institution_name: School.first&.name,
        account_created_at: current_user.created_at,
        account_status: current_user.active? ? "active" : "inactive",
        assigned_context: assigned_context
      )
    end

    def assigned_context
      if current_user.teacher?
        { title: "Clases asignadas", count: current_user.courses.count }
      elsif current_user.guardian?
        { title: "Hijos vinculados", count: current_user.children.count }
      elsif current_user.learner?
        { title: "Inscripciones", count: current_user.student&.enrollments&.count.to_i }
      else
        { title: "Funciones asignadas", count: current_user.access_roles.count }
      end
    end
  end
end
