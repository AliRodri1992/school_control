require "rails_helper"

RSpec.describe "Account security", type: :request do
  let(:user) { create(:user) }
  let(:new_password) { "Updated-school-password-26" }

  def browser_for(account)
    ActionDispatch::Integration::Session.new(Rails.application).tap do |browser|
      browser.post "/api/session", params: { email: account.email, password: "School-test-password-26" }, as: :json
      expect(browser.response).to have_http_status(:ok)
    end
  end

  def reset_password(token, password: new_password, confirmation: password)
    patch "/api/password_reset", params: { token: token, password: password, password_confirmation: confirmation }, as: :json
  end

  it "gives identical responses for active, disabled and unknown addresses" do
    disabled = create(:user, active: false)
    responses = [ user.email.upcase, disabled.email, "missing@school.test" ].map do |email|
      post "/api/password_reset", params: { email: email }, as: :json
      expect(response).to have_http_status(:accepted)
      response.parsed_body
    end
    expect(responses.uniq.size).to eq(1)
    jobs = ActiveJob::Base.queue_adapter.enqueued_jobs.select { |job| job[:job] == PasswordRecoveryJob }
    expect(jobs.map { |job| job[:args] }).to include([ user.id, user.session_version ])
    expect(jobs.map { |job| job[:args].first }).not_to include(disabled.id)
  end

  it "accepts a valid link once and revokes every existing session" do
    first = browser_for(user)
    second = browser_for(user)
    token = user.generate_token_for(:password_recovery)
    reset_password(token)
    expect(response).to have_http_status(:ok)
    expect(user.reload.authenticate(new_password)).to eq(user)
    expect(AuditEvent.where(action: "user.password_reset", record_id: user.id)).to exist
    [ first, second ].each do |browser|
      browser.get "/api/profile"
      expect(browser.response).to have_http_status(:unauthorized)
    end
    reset_password(token)
    expect(response).to have_http_status(:unprocessable_content)
    post "/api/session", params: { email: user.email, password: new_password }, as: :json
    expect(response).to have_http_status(:ok)
    get "/api/profile"
    expect(response).to have_http_status(:ok)
  end

  it "rejects expired and malformed links" do
    token = user.generate_token_for(:password_recovery)
    travel 16.minutes do
      reset_password(token)
      expect(response).to have_http_status(:unprocessable_content)
    end
    reset_password("not-a-token")
    expect(response).to have_http_status(:unprocessable_content)
    expect(user.reload.authenticate("School-test-password-26")).to eq(user)
  end

  it "retains the link and password after invalid password submissions" do
    token = user.generate_token_for(:password_recovery)
    reset_password(token, password: "short")
    expect(response).to have_http_status(:unprocessable_content)
    reset_password(token, confirmation: "different-password")
    expect(response).to have_http_status(:unprocessable_content)
    expect(user.reload.session_version).to eq(0)
    reset_password(token)
    expect(response).to have_http_status(:ok)
  end

  it "invalidates links and sessions on deactivation even after reactivation" do
    browser = browser_for(user)
    token = user.generate_token_for(:password_recovery)
    user.update!(active: false)
    reset_password(token)
    expect(response).to have_http_status(:unprocessable_content)
    user.update!(active: true)
    browser.get "/api/profile"
    expect(browser.response).to have_http_status(:unauthorized)
    reset_password(token)
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "invalidates links and sessions when the account email changes" do
    browser = browser_for(user)
    token = user.generate_token_for(:password_recovery)
    user.update!(email: "updated@school.test")
    browser.get "/api/profile"
    expect(browser.response).to have_http_status(:unauthorized)
    reset_password(token)
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "requires the current password to revoke sessions and does not target another user" do
    browser = browser_for(user)
    other = create(:user)
    other_browser = browser_for(other)
    browser.delete "/api/profile/sessions", params: { current_password: "wrong" }, as: :json
    expect(browser.response).to have_http_status(:unprocessable_content)
    expect(user.reload.session_version).to eq(0)
    browser.delete "/api/profile/sessions", params: { current_password: "School-test-password-26", user_id: other.id }, as: :json
    expect(browser.response).to have_http_status(:ok)
    browser.get "/api/profile"
    expect(browser.response).to have_http_status(:unauthorized)
    other_browser.get "/api/profile"
    expect(other_browser.response).to have_http_status(:ok)
  end

  it "changes a password from the profile only after checking the current one" do
    browser = browser_for(user)
    fields = { current_password: "wrong", password: new_password, password_confirmation: new_password }
    browser.patch "/api/profile/password", params: fields, as: :json
    expect(browser.response).to have_http_status(:unprocessable_content)
    browser.patch "/api/profile/password", params: fields.merge(current_password: "School-test-password-26"), as: :json
    expect(browser.response).to have_http_status(:ok)
    expect(user.reload.authenticate(new_password)).to eq(user)
    browser.get "/api/profile"
    expect(browser.response).to have_http_status(:unauthorized)
  end

  it "rolls back a password change if its audit cannot be saved" do
    token = user.generate_token_for(:password_recovery)
    allow(AuditEvent).to receive(:create!).and_raise(ActiveRecord::RecordInvalid.new(AuditEvent.new))
    reset_password(token)
    expect(response).to have_http_status(:unprocessable_content)
    expect(user.reload.session_version).to eq(0)
    expect(user.authenticate("School-test-password-26")).to eq(user)
    expect(User.find_by_token_for(:password_recovery, token)).to eq(user)
  end

  it "rejects unauthenticated profile security operations" do
    patch "/api/profile/password", params: {}, as: :json
    expect(response).to have_http_status(:unauthorized)
    delete "/api/profile/sessions", params: {}, as: :json
    expect(response).to have_http_status(:unauthorized)
  end

  it "preserves CSRF protection for public recovery requests" do
    previous = ActionController::Base.allow_forgery_protection
    ActionController::Base.allow_forgery_protection = true
    post "/api/password_reset", params: { email: user.email }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
  ensure
    ActionController::Base.allow_forgery_protection = previous
  end
end
