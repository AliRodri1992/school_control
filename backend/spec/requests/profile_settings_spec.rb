require "rails_helper"

RSpec.describe "Self-service profile settings", type: :request do
  let(:user) { create(:user, name: "María González", role: "teacher") }

  def login(account)
    post "/api/session", params: { email: account.email, password: "School-test-password-26" }, as: :json
    expect(response).to have_http_status(:ok)
  end

  it "updates the signed-in display name and notification preference without changing account privileges" do
    login(user)
    patch "/api/profile", params: { name: "Carmen Rivera", email_notifications: true,
                                    role: "admin", email: "forged@school.test",
                                    id: create(:user).id }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include("name" => "Carmen Rivera", "email_notifications" => true)
    expect(user.reload).to have_attributes(name: "Carmen Rivera", role: "teacher", email: user.email)
    get "/api/profile", as: :json
    expect(response.parsed_body).to include("name" => "Carmen Rivera", "email_notifications" => true)
  end

  it "rejects empty names and does not persist the attempted update" do
    login(user)
    patch "/api/profile", params: { name: " ", email_notifications: true }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(user.reload.name).to eq("María González")
    expect(user.email_notifications).to be(false)
  end

  it "does not allow anonymous users to fetch or change profile data" do
    get "/api/profile"
    expect(response).to have_http_status(:unauthorized)
    patch "/api/profile", params: { name: "Intruso" }, as: :json
    expect(response).to have_http_status(:unauthorized)
  end
end
