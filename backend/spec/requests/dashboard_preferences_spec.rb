require "rails_helper"

RSpec.describe "Personal dashboard", type: :request do
  let(:user) { create(:user) }
  let(:configuration) do
    { widgets: [ { id: "chart", kind: "attendance_chart", title: "Asistencia" } ],
      layouts: %w[lg md sm xs].index_with { [ { i: "chart", x: 0, y: 0, w: 1, h: 4 } ] } }
  end

  def login(account)
    post "/api/session", params: { email: account.email, password: "School-test-password-26" }, as: :json
  end

  it "requires authentication" do
    get "/api/dashboard_preference"
    expect(response).to have_http_status(:unauthorized)
  end

  it "persists all layouts and isolates users even when a foreign user id is supplied" do
    login(user)
    put "/api/dashboard_preference", params: { configuration: configuration, lock_version: nil }, as: :json
    expect(response).to have_http_status(:ok)
    get "/api/dashboard_preference"
    expect(response.parsed_body.fetch("configuration")).to eq(configuration.deep_stringify_keys)
    other = create(:user)
    login(other)
    get "/api/dashboard_preference", params: { user_id: user.id }
    expect(response.parsed_body.fetch("configuration")).to be_nil
  end

  it "ignores injected ownership and unrelated attributes" do
    other = create(:user)
    login(user)
    put "/api/dashboard_preference", params: { user_id: other.id, configuration: configuration.merge(admin: true) }, as: :json
    expect(response).to have_http_status(:ok)
    expect(DashboardPreference.last.user).to eq(user)
    expect(DashboardPreference.last.configuration.keys).to contain_exactly("widgets", "layouts")
  end

  it "rejects malformed layouts and unsupported data sources" do
    login(user)
    configuration[:widgets][0][:kind] = "psychological_records"
    put "/api/dashboard_preference", params: { configuration: configuration }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(DashboardPreference.count).to eq(0)
  end

  it "rejects coordinates outside the mobile grid" do
    login(user)
    configuration[:layouts]["xs"][0][:w] = 12
    put "/api/dashboard_preference", params: { configuration: configuration }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "prevents a stale session overwriting saved changes" do
    login(user)
    put "/api/dashboard_preference", params: { configuration: configuration }, as: :json
    version = response.parsed_body.fetch("lock_version")
    configuration[:widgets][0][:title] = "Actualizado"
    put "/api/dashboard_preference", params: { configuration: configuration, lock_version: version }, as: :json
    expect(response).to have_http_status(:ok)
    put "/api/dashboard_preference", params: { configuration: configuration, lock_version: version }, as: :json
    expect(response).to have_http_status(:conflict)
  end
end
