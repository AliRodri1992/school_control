require "rails_helper"

RSpec.describe "Applicant to enrolled student lifecycle", type: :request do
  def login(account)
    post "/api/session", params: { email: account.email, password: "School-test-password-26" }, as: :json
    expect(response).to have_http_status(:ok)
  end

  it "keeps a family applicant separate until approval and formalization" do
    guardian = create(:user, role: "guardian")
    admin = create(:user, role: "admin")
    year = create(:academic_year)
    group = create(:group, academic_year: year)
    login(guardian)

    post "/api/students", params: { first_name: "Sara", last_name: "Prueba", curp: "DEMO200101MDFRNN01",
      birth_date: "2020-01-01" }, as: :json
    expect(response).to have_http_status(:created)
    student_id = response.parsed_body.fetch("id")

    post "/api/admissions", params: { student_id: student_id, academic_year_id: year.id,
      grade_level: 1, kind: "new", draft: true }, as: :json
    expect(response).to have_http_status(:created)
    id = response.parsed_body.fetch("id")
    expect(response.parsed_body["folio"]).to be_nil

    post "/api/admissions/#{id}/submit", as: :json
    expect(response).to have_http_status(:unprocessable_content)

    post "/api/students/#{student_id}/details/addresses",
      params: { country_code: "MX", purpose: "home", line1: "Calle Demo 12", primary: true }, as: :json
    expect(response).to have_http_status(:created)
    post "/api/students/#{student_id}/details/phones",
      params: { number_e164: "+525555555555", country_code: "MX", purpose: "emergency", primary: true }, as: :json
    expect(response).to have_http_status(:created)
    post "/api/student_contacts",
      params: { student_id: student_id, name: "Tutor de prueba", relationship: "Madre",
        phone: "5512345678", emergency: true, pickup_authorized: true }, as: :json
    expect(response).to have_http_status(:created)

    post "/api/admissions/#{id}/submit", as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["folio"]).to start_with("ESC-")
    expect(Student.find(student_id).enrollment_stage).to eq("applicant")

    login(admin)
    post "/api/admissions/#{id}/approve", as: :json
    expect(response).to have_http_status(:ok)
    expect(Enrollment.where(admission_id: id)).not_to exist
    post "/api/admissions/#{id}/formalize", params: { group_id: group.id }, as: :json
    expect(response).to have_http_status(:created)
    expect(Student.find(student_id).enrollment_stage).to eq("enrolled")
    expect(Student.find(student_id).student_contacts.count).to eq(1)
    expect(Student.find(student_id).addresses.count).to eq(1)
    post "/api/admissions/#{id}/formalize", params: { group_id: group.id }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(Enrollment.where(student_id: student_id).count).to eq(1)
  end
end
