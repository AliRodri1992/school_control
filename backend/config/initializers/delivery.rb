Rails.application.configure do
  config.active_job.queue_adapter = Rails.env.test? ? :test : :sidekiq
  if Rails.env.development?
    config.action_mailer.delivery_method = :letter_opener_web
    config.action_mailer.perform_deliveries = true
    LetterOpenerWeb.configure do |letter|
      letter.letters_location = Rails.root.join("storage", "letter_opener")
    end
  elsif Rails.env.production?
    config.action_mailer.perform_deliveries = ENV["ENABLE_EMAIL_DELIVERY"] == "true"
    config.action_mailer.delivery_method = :smtp
    config.action_mailer.smtp_settings = {
      address: ENV["SMTP_ADDRESS"], port: ENV.fetch("SMTP_PORT", 587).to_i,
      user_name: ENV["SMTP_USERNAME"], password: ENV["SMTP_PASSWORD"],
      authentication: :plain, enable_starttls_auto: true
    }
  end
end

Noticed.parent_class = "ApplicationJob"
