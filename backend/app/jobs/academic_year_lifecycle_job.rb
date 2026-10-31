# Bootstrapped by the Sidekiq worker, then checks each school day at 00:10.
# Database row locks and the partial unique index protect concurrent executions.
class AcademicYearLifecycleJob
  include Sidekiq::Job

  sidekiq_options queue: "default", retry: 5

  def perform
    AcademicYearLifecycle.run_all!(today: Time.zone.today)
    # Schedule the next run only after success; Sidekiq handles retries on failure.
    self.class.perform_at(Time.zone.tomorrow.beginning_of_day + 10.minutes)
  end
end
