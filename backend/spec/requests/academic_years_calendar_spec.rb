require "rails_helper"

RSpec.describe "Academic years management", type: :request do
  def login(role)
    user = create(:user, role: role)
    post "/api/session", params: { email: user.email, password: "School-test-password-26" }, as: :json
    user
  end

  it "supports show, update, PDF and safe deletion for an administrator" do
    login("admin")
    year = create(:academic_year)
    get "/api/academic_years/#{year.id}"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include("name" => year.name, "calendar_events" => [])

    patch "/api/academic_years/#{year.id}", params: { planned_school_days: 185, calendar_source: "sep" }, as: :json
    expect(response).to have_http_status(:ok)
    expect(year.reload.planned_school_days).to eq(185)

    get "/api/academic_years/#{year.id}/pdf"
    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("application/pdf")
    expect(response.body).to start_with("%PDF")

    delete "/api/academic_years/#{year.id}"
    expect(response).to have_http_status(:no_content)
    expect(AcademicYear.exists?(year.id)).to be(false)
  end

  it "blocks deletion when records are linked" do
    login("admin")
    year = create(:academic_year)
    create(:group, academic_year: year)
    delete "/api/academic_years/#{year.id}"
    expect(response).to have_http_status(:conflict)
    expect(AcademicYear.exists?(year.id)).to be(true)
  end

  it "keeps restricted actions inaccessible to family accounts" do
    login("guardian")
    year = create(:academic_year)
    get "/api/academic_years/#{year.id}/pdf"
    expect(response).to have_http_status(:forbidden)
    delete "/api/academic_years/#{year.id}"
    expect(response).to have_http_status(:forbidden)
  end
end
