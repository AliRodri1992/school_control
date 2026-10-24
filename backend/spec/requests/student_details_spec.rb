require "rails_helper"

RSpec.describe "polymorphic student details", type: :request do
  it "rejects requests without a session" do
    student = create(:student)
    get "/api/students/#{student.id}/details/addresses"
    expect(response).to have_http_status(:unauthorized)
  end

  it "rejects unsupported record types" do
    admin = create(:user, role: "admin")
    student = create(:student)
    post "/api/session", params: { email: admin.email, password: "password-not-available" }
    get "/api/students/#{student.id}/details/invalid"
    expect(response).not_to have_http_status(:ok)
  end
end
