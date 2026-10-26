require "rails_helper"

RSpec.describe "Personal device sessions", type: :request do
  let(:user) { create(:user) }

  def browser_for(account)
    ActionDispatch::Integration::Session.new(Rails.application).tap do |browser|
      browser.post "/api/session", params: {
        email: account.email, password: "School-test-password-26"
      }, as: :json
      expect(browser.response).to have_http_status(:ok)
    end
  end

  it "lists separately authenticated sessions and revokes just the selected device" do
    first = browser_for(user)
    second = browser_for(user)
    other = create(:user)
    unrelated = browser_for(other)
    first.get "/api/profile/devices"
    expect(first.response).to have_http_status(:ok)
    devices = first.response.parsed_body.fetch("devices")
    expect(devices.size).to eq(2)
    current = devices.find { |device| device.fetch("current") }
    to_revoke = devices.find { |device| !device.fetch("current") }
    expect(current).to be_present
    first.delete "/api/profile/devices/#{to_revoke.fetch('id')}",
      params: { current_password: "School-test-password-26" }, as: :json
    expect(first.response).to have_http_status(:ok)
    first.get "/api/profile"
    expect(first.response).to have_http_status(:ok)
    second.get "/api/profile"
    expect(second.response).to have_http_status(:unauthorized)
    unrelated.get "/api/profile"
    expect(unrelated.response).to have_http_status(:ok)
  end

  it "requires the current password and cannot revoke another user's device" do
    first = browser_for(user)
    other = create(:user)
    browser_for(other)
    id = other.login_sessions.first.id
    first.delete "/api/profile/devices/#{id}", params: {
      current_password: "School-test-password-26"
    }, as: :json
    expect(first.response).to have_http_status(:not_found)
    first.delete "/api/profile/devices/#{user.login_sessions.first.id}", params: {
      current_password: "wrong"
    }, as: :json
    expect(first.response).to have_http_status(:unprocessable_content)
  end

  it "invalidates all simultaneous browsers after a global session revoke" do
    first = browser_for(user)
    second = browser_for(user)
    first.delete "/api/profile/sessions", params: {
      current_password: "School-test-password-26"
    }, as: :json
    expect(first.response).to have_http_status(:ok)
    [ first, second ].each do |browser|
      browser.get "/api/profile"
      expect(browser.response).to have_http_status(:unauthorized)
    end
    expect(user.login_sessions.active.count).to eq(0)
  end
end
