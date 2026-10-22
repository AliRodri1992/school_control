class PasswordMailer < ApplicationMailer
  def recovery
    @school = School.first!
    @recipient = params[:recipient]
    token = @recipient.generate_token_for(:password_recovery)
    @reset_url = "#{ENV.fetch('PORTAL_URL', 'http://localhost:5173').delete_suffix('/')}#reset-password=#{ERB::Util.url_encode(token)}"
    if @school.logo.attached?
      attachments.inline["school-logo"] = { mime_type: @school.logo.content_type, content: @school.logo.download }
    end
    mail(to: @recipient.email, from: ENV.fetch("MAIL_FROM", "avisos@school.test"), subject: "#{@school.name}: recupera tu acceso")
  end
end
