require "rails_helper"
require "tempfile"

RSpec.describe "Extended personal account profile", type: :request do
  let(:user) { create(:user, name: "María Gómez", role: "guardian") }

  def sign_in(account = user)
    post "/api/session", params: { email: account.email, password: "School-test-password-26" }, as: :json
    expect(response).to have_http_status(:ok)
  end

  it "only returns the signed-in user's account, school and authorized summary" do
    other = create(:user)
    create(:student, guardian: user)
    sign_in
    get "/api/profile"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include(
      "name" => "María Gómez", "avatar_url" => nil, "phone_e164" => nil,
      "account_status" => "active", "assigned_context" => { "title" => "Hijos vinculados", "count" => 1 }
    )
    expect(response.parsed_body.fetch("account_created_at")).to be_present
    expect(response.parsed_body.fetch("email")).not_to eq(other.email)
  end

  it "updates an international mobile phone only for the authenticated user" do
    other = create(:user)
    sign_in
    patch "/api/profile", params: { name: "  María González  ", phone_e164: "+525512345678",
                                    user_id: other.id }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include("phone_e164" => "+525512345678", "name" => "María González")
    expect(user.phone_numbers.find_by!(purpose: "mobile", primary: true).number_e164).to eq("+525512345678")
    expect(other.phone_numbers.count).to eq(0)

    patch "/api/profile", params: { phone_e164: "not-a-number" }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(user.phone_numbers.find_by!(purpose: "mobile", primary: true).number_e164).to eq("+525512345678")

    patch "/api/profile", params: { phone_e164: "" }, as: :json
    expect(response).to have_http_status(:ok)
    expect(user.phone_numbers.count).to eq(0)
  end

  it "requires authentication for avatar download and upload" do
    get "/api/profile/avatar"
    expect(response).to have_http_status(:unauthorized)
    post "/api/profile/avatar", params: {}, as: :json
    expect(response).to have_http_status(:unauthorized)
  end

  it "rejects unsupported avatar content instead of trusting the filename" do
    sign_in
    Tempfile.create([ "disguised", ".png" ]) do |file|
      file.write("<svg><script>alert(1)</script></svg>")
      file.flush
      upload = Rack::Test::UploadedFile.new(file.path, "image/png")
      post "/api/profile/avatar", params: { avatar: upload }
      expect(response).to have_http_status(:unprocessable_content)
      expect(user.reload.avatar).not_to be_attached
    end
  end

  it "uploads and reads an actual PNG privately, then removes it" do
    sign_in
    Tempfile.create([ "avatar", ".png" ]) do |file|
      file.binmode
      file.write(Base64.decode64("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/4ZYAAAAASUVORK5CYII="))
      file.flush
      upload = Rack::Test::UploadedFile.new(file.path, "image/png")
      post "/api/profile/avatar", params: { avatar: upload }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.fetch("avatar_url")).to eq("/api/profile/avatar")
      get "/api/profile/avatar"
      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("image/png")
      expect(response.headers.fetch("Cache-Control")).to include("no-store")
      delete "/api/profile/avatar"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["avatar_url"]).to be_nil
    end
  end
end
