require "rails_helper"

RSpec.describe "Verified personal account email change", type: :request do
  let(:user) { create(:user) }
  let(:new_email) { "new-account@school.test" }

  def login(account = user)
    post "/api/session", params: { email: account.email, password: "School-test-password-26" }, as: :json
    expect(response).to have_http_status(:ok)
  end

  def valid_token
    Rails.application.message_verifier(:profile_email_change).generate(
      { "user_id" => user.id, "old_email" => user.email, "new_email" => new_email,
        "session_version" => user.session_version }, expires_in: 15.minutes
    )
  end

  it "requires the current password and sends a verification message to the proposed email" do
    login
    post "/api/profile/email_change", params: { email: new_email, current_password: "wrong" }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(user.reload.email).not_to eq(new_email)

    post "/api/profile/email_change", params: { email: new_email,
      current_password: "School-test-password-26" }, as: :json
    expect(response).to have_http_status(:accepted)
    expect(user.reload.email).not_to eq(new_email)
    expect(ActiveJob::Base.queue_adapter.enqueued_jobs.any? { |job|
      job[:job] == ActionMailer::MailDeliveryJob
    }).to be(true)
  end

  it "requires account ownership, consumes the old email identity and revokes the session" do
    login
    token = valid_token
    post "/api/profile/email_change/confirm", params: { token: token }, as: :json
    expect(response).to have_http_status(:ok)
    expect(user.reload.email).to eq(new_email)
    get "/api/profile"
    expect(response).to have_http_status(:unauthorized)
    expect(AuditEvent.where(action: "user.email_changed", record_id: user.id)).to exist
  end

  it "rejects invalid, expired and cross-account verification links" do
    login
    post "/api/profile/email_change/confirm", params: { token: "bad-token" }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expired_token = valid_token
    travel 16.minutes do
      post "/api/profile/email_change/confirm", params: { token: expired_token }, as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end
    expect(user.reload.email).not_to eq(new_email)
    other = create(:user)
    token = valid_token
    delete "/api/session", as: :json
    login(other)
    post "/api/profile/email_change/confirm", params: { token: token }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(other.reload.email).not_to eq(new_email)
  end

  it "rejects email collisions and bypassing verification through the basic profile form" do
    other = create(:user)
    login
    patch "/api/profile", params: { email: new_email }, as: :json
    expect(user.reload.email).not_to eq(new_email)
    post "/api/profile/email_change", params: { email: other.email, current_password: "School-test-password-26" }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(user.reload.email).not_to eq(other.email)
  end

  it "requires an authenticated account to initiate or confirm a change" do
    post "/api/profile/email_change", params: { email: new_email }, as: :json
    expect(response).to have_http_status(:unauthorized)
    post "/api/profile/email_change/confirm", params: { token: valid_token }, as: :json
    expect(response).to have_http_status(:unauthorized)
  end
end
