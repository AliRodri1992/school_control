# CI uses a fresh demo database and never sends external mail.
require "sidekiq/api"
raise "Only run against the development smoke-test environment" unless Rails.env.development?
queue = Sidekiq::Queue.new("default")
raise "Worker is not connected" if Sidekiq::ProcessSet.new.size.zero?
ActivityNotifier.with(title: "Verificación de cola", page: "dashboard").deliver(User.find_by!(role: "admin"))
30.times do
  break if queue.size.zero?
  sleep 0.5
end
raise "Notification queue did not drain" unless queue.size.zero?
raise "Failed jobs detected" unless Sidekiq::RetrySet.new.size.zero?
puts "Worker connected; notification queue drained without retries."
