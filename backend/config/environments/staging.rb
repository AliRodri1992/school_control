require_relative "production"

Rails.application.configure do
  config.action_mailer.delivery_method = :test
  config.action_mailer.perform_deliveries = false
end
