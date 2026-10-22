class SchoolMailer < ApplicationMailer
  def activity
    @school = School.first!
    @template = EmailTemplate.activity
    @recipient = params[:recipient]
    @portal_url = ENV.fetch("PORTAL_URL", "http://localhost:5173")
    if @school.logo.attached?
      attachments.inline["school-logo"] = { mime_type: @school.logo.content_type, content: @school.logo.download }
    end
    mail(to: @recipient.email, from: ENV.fetch("MAIL_FROM", "avisos@school.test"), subject: "#{@school.name}: #{@template.subject}")
  end
end
