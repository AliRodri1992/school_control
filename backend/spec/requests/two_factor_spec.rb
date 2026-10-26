require "rails_helper"

RSpec.describe "Two-step authentication", type: :request do
  let(:user) { create(:user) }

  def login
    post "/api/session", params: { email: user.email, password: "School-test-password-26" }, as: :json
  end

  it "requires the existing password before revealing the authenticator secret" do
    login
    post "/api/profile/two_factor/setup", params: { current_password: "incorrect" }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    post "/api/profile/two_factor/setup", params: {
      current_password: "School-test-password-26"
    }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("secret")).to be_present
    expect(response.parsed_body.fetch("provisioning_uri")).to include("otpauth://")
    expect(user.totp_credential.reload.enabled?).to be(false)
  end

  it "blocks login until the TOTP challenge is verified and prevents code reuse" do
    login
    post "/api/profile/two_factor/setup", params: {
      current_password: "School-test-password-26"
    }, as: :json
    credential = user.totp_credential
    code = TotpAuthenticator.hotp(credential.secret, Time.current.to_i / 30)
    post "/api/profile/two_factor/confirm", params: { code: code }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("recovery_codes").length).to eq(8)
    delete "/api/session"
    login
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("mfa_required")).to be(true)
    get "/api/profile"
    expect(response).to have_http_status(:unauthorized)
    # TOTP codes cannot be replayed; a recovery code is valid for one challenge only.
    post "/api/session/verify_otp", params: { code: code }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    post "/api/session/verify_otp", params: { code: "INVALID" }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "accepts a fresh code and issues a session only after MFA succeeds" do
    login
    post "/api/profile/two_factor/setup", params: {
      current_password: "School-test-password-26"
    }, as: :json
    credential = user.totp_credential
    code = TotpAuthenticator.hotp(credential.secret, Time.current.to_i / 30)
    post "/api/profile/two_factor/confirm", params: { code: code }, as: :json
    expect(response).to have_http_status(:ok)
    recovery = response.parsed_body.fetch("recovery_codes").first
    delete "/api/session"
    login
    expect(response.parsed_body.fetch("mfa_required")).to be(true)
    post "/api/session/verify_otp", params: { code: recovery }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("user").fetch("id")).to eq(user.id)
    get "/api/profile"
    expect(response).to have_http_status(:ok)
    expect(user.totp_credential.recovery_codes.where(used_at: nil).count).to eq(7)
  end
end
