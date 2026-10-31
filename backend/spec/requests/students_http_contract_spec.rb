require "rails_helper"

RSpec.describe "Student API JSON contract", type: :request do
  let(:admin) { create(:user, role: "admin") }

  it "responds with JSON for an unauthenticated GET instead of an HTML error" do
    get "/api/students", headers: { "ACCEPT" => "application/json" }
    expect(response).to have_http_status(:unauthorized)
    expect(response.media_type).to eq("application/json")
    expect(response.parsed_body.fetch("error")).to be_present
  end

  it "returns a JSON list for an authorized GET with multiple student records" do
    12.times { create(:student) }
    post "/api/session", params: { email: admin.email, password: "School-test-password-26" }, as: :json
    expect(response).to have_http_status(:ok)

    get "/api/students", headers: { "ACCEPT" => "application/json", "CONTENT_TYPE" => "application/json" }
    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("application/json")
    expect(response.parsed_body.length).to eq(12)
  end

  it "reports a missing guardian as JSON validation errors, not an HTML HTTP 400" do
    post "/api/session", params: { email: admin.email, password: "School-test-password-26" }, as: :json
    post "/api/students", params: {
      first_name: "Elena", last_name: "Prueba", curp: "PELE200101MDFRNN05",
      birth_date: "2020-01-01"
    }, as: :json

    expect(response).to have_http_status(:unprocessable_content)
    expect(response.media_type).to eq("application/json")
    expect(response.parsed_body.fetch("errors")).to include("guardian")
  end
end
