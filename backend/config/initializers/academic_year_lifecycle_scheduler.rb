# A Sidekiq worker starts the recurring lifecycle evaluation on boot.
# A restart can enqueue another job; transitions are idempotent and locked.
if defined?(Sidekiq)
  Sidekiq.configure_server do |config|
    config.on(:startup) { AcademicYearLifecycleJob.perform_async }
  end
end
