require "rails_helper"

RSpec.describe "Admission document requirements", type: :request do
  let(:admin) { create(:user, role: "admin") }

  before do
    post "/api/session", params: { email: admin.email, password: "School-test-password-26" }, as: :json
  end

  it "creates and lists cycle-specific required documents" do
    year = create(:academic_year)
    post "/api/admission_document_requirements",
      params: { academic_year_id: year.id, grade_level: 1, title: "Acta de nacimiento",
        required_for_submission: true, required_for_formalization: true }, as: :json
    expect(response).to have_http_status(:created)
    get "/api/admission_document_requirements", params: { academic_year_id: year.id, grade_level: 1 }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.pluck("title")).to eq([ "Acta de nacimiento" ])
  end

  it "reports the sections missing from a draft admission" do
    admission = create(:admission)
    admission.update!(status: "draft")
    get "/api/admissions/#{admission.id}/readiness"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["missing_for_submission"]).to include("Domicilio principal")
  end
end
