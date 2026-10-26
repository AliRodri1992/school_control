class ActivityNotifier < Noticed::Event
  required_params :title, :page

  deliver_by :email do |config|
    config.mailer = "SchoolMailer"
    config.method = :activity
    config.if = -> { recipient.active? && recipient.email_notifications? &&
      recipient.user_preference&.notification_email != false &&
      (Rails.env.development? || ENV["ENABLE_EMAIL_DELIVERY"] == "true") }
  end

  notification_methods do
    def title = params[:title]
    def page = params[:page]
  end
end
