require "rails_helper"

RSpec.describe PasswordRecoveryJob, type: :job do
  it "does not send a queued link after credentials change or an account is disabled" do
    user = create(:user)
    version = user.session_version
    user.update!(email: "changed@school.test")
    expect(PasswordMailer).not_to receive(:with)
    described_class.perform_now(user.id, version)
    user.update!(active: false)
    described_class.perform_now(user.id, user.session_version)
  end

  it "generates the recovery email when the worker executes the job" do
    School.create!(name: "Primaria")
    user = create(:user, email_notifications: false)
    expect do
      described_class.perform_now(user.id, user.session_version)
    end.to change(ActionMailer::Base.deliveries, :count).by(1)
  end
end
