if ENV["COVERAGE"] == "true"
  require "simplecov"
  SimpleCov.start "rails" do
    enable_coverage :branch
    add_filter "/spec/"
    track_files "app/**/*.rb"
  end
end
ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
abort("Tests require RAILS_ENV=test") unless Rails.env.test?
require "rspec/rails"
require "shoulda/matchers"
ActiveRecord::Migration.maintain_test_schema!
Dir[Rails.root.join("spec/support/**/*.rb")].sort.each { |file| require file }
RSpec.configure do |config|
  config.use_transactional_fixtures = true
  config.infer_spec_type_from_file_location!
  config.include FactoryBot::Syntax::Methods
  config.include ActiveSupport::Testing::TimeHelpers
  config.order = :random
end
Shoulda::Matchers.configure do |config|
  config.integrate do |with|
    with.test_framework :rspec
    with.library :rails
  end
end
