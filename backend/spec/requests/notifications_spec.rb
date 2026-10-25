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

  it "marks only the signed-in user's unread notifications as read in bulk" do
    other_user = create(:user)
    2.times { |index| ActivityNotifier.with(title: "Aviso #{index + 1}", page: "dashboard").deliver(user) }
    ActivityNotifier.with(title: "Ajeno", page: "dashboard").deliver(other_user)
    login(user)

    post "/api/notifications/read_all", as: :json

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq("unread_count" => 0)
    expect(user.notifications.unread.count).to eq(0)
    expect(other_user.notifications.unread.count).to eq(1)
    get "/api/notifications", as: :json
    expect(response.parsed_body.fetch("items").count).to eq(2)
    expect(response.parsed_body.fetch("items").all? { |item| item["read_at"].present? }).to be(true)
  end

  it "keeps bulk marking idempotent when there are no unread notifications" do
    login(user)
    2.times do
      post "/api/notifications/read_all", as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.fetch("unread_count")).to eq(0)
    end
  end

  it "rejects unauthenticated bulk mark-read requests" do
    post "/api/notifications/read_all", as: :json
    expect(response).to have_http_status(:unauthorized)
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
