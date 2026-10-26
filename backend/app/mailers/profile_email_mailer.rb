class ProfileEmailMailer < ApplicationMailer
  def verification
    @recipient = params.fetch(:recipient)
    @new_email = params.fetch(:new_email)
    @token = params.fetch(:token)
    @verify_url = "#{ENV.fetch('PORTAL_URL', 'http://localhost:5173').delete_suffix('/')}?verify_email=#{ERB::Util.url_encode(@token)}"
    mail(to: @new_email, from: ENV.fetch("MAIL_FROM", "avisos@school.test"),
      subject: "School Control: confirma tu nuevo correo")
  end
end
