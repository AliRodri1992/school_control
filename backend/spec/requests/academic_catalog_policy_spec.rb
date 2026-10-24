require "rails_helper"

RSpec.describe "academic catalog policies", type: :request do
  def login(user)
    post "/api/session", params: { email: user.email, password: "School-test-password-26" }, as: :json
  end

  it "scopes groups to the assigned teacher without revealing other groups" do
    teacher = create(:user, role: "teacher")
    owned = create(:group)
    create(:course, group: owned, teacher: teacher)
    another = create(:group)
    login(teacher)
    get "/api/groups"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.pluck("id")).to contain_exactly(owned.id)
    expect(response.parsed_body.pluck("id")).not_to include(another.id)
  end

  it "limits teacher write access even if they can read the academic catalog" do
    teacher = create(:user, role: "teacher")
    login(teacher)
    post "/api/groups", params: { academic_year_id: create(:academic_year).id,
      grade_level: 1, section: "D", capacity: 25 }, as: :json
    expect(response).to have_http_status(:forbidden)
    post "/api/subjects", params: { name: "Música", code: "MUS-22" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "allows authorized administrators to create a subject using the policy" do
    login(create(:user, role: "admin"))
    post "/api/subjects", params: { name: "Artes", code: "ARTES-1" }, as: :json
    expect(response).to have_http_status(:created)
    expect(Subject.find_by!(code: "ARTES-1").name).to eq("Artes")
  end

  it "protects schedule generation with a specific institutional permission" do
    group = create(:group)
    login(create(:user, role: "teacher"))
    post "/api/groups/#{group.id}/generate_schedule", as: :json
    expect(response).to have_http_status(:forbidden)
  end
end
