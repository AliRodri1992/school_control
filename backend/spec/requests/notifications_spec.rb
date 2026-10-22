require "rails_helper"

RSpec.describe "Notification center and profile", type: :request do
  let(:user) { create(:user) }

  def login(account)
    post "/api/session", params: { email: account.email, password: "School-test-password-26" }, as: :json
  end

  it "isolates notifications and updates unread count" do
    ActivityNotifier.with(title: "Aviso", page: "dashboard").deliver(user)
    notification = user.notifications.last
    login(create(:user))
    post "/api/notifications/#{notification.id}/read"
    expect(response).to have_http_status(:not_found)
    login(user)
    get "/api/notifications"
    expect(response.parsed_body["unread_count"]).to eq(1)
    post "/api/notifications/#{notification.id}/read"
    expect(response).to have_http_status(:ok)
    get "/api/notifications"
    expect(response.parsed_body["unread_count"]).to eq(0)
  end

  it "allows preferences but never role or account ownership changes" do
    login(user)
    patch "/api/profile", params: { name: "Nuevo nombre", email_notifications: true, role: "admin", id: create(:user).id }, as: :json
    expect(response).to have_http_status(:ok)
    expect(user.reload.name).to eq("Nuevo nombre")
    expect(user.email_notifications).to be(true)
    expect(user.role).to eq("guardian")
  end

  it "protects email templates from families" do
    login(user)
    get "/api/email_templates"
    expect(response).to have_http_status(:forbidden)
  end
end
