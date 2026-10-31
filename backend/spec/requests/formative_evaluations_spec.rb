require "rails_helper"

RSpec.describe "Formative field evaluations", type: :request do
  let(:admin) { create(:user, role: "admin") }
  let(:enrollment) { create(:enrollment) }

  def login(account)
    post "/api/session", params: { email: account.email, password: "School-test-password-26" }, as: :json
    expect(response).to have_http_status(:ok)
  end

  it "captures one partial result per field and term and publishes only with permission" do
    login(admin)
    twice = { enrollment_id: enrollment.id, field_code: "languages", term: 1, score: 8, feedback: "Buen progreso" }
    2.times do
      post "/api/formative_evaluations", params: twice, as: :json
      expect(response).to have_http_status(:ok)
    end
    expect(enrollment.formative_evaluations.count).to eq(1)
    record = enrollment.formative_evaluations.sole
    post "/api/formative_evaluations/#{record.id}/publish", as: :json
    expect(response).to have_http_status(:ok)
    expect(record.reload.status).to eq("published")
    expect(record.published_at).to be_present
    post "/api/formative_evaluations", params: twice.merge(score: 9), as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(record.reload.score.to_f).to eq(8.0)
  end

  it "keeps draft formative evaluations hidden from guardians" do
    create(:course, group: enrollment.group)
    FormativeEvaluation.create!(enrollment: enrollment, field_code: "languages", term: 1, score: 8)
    login(enrollment.student.guardian)
    get "/api/students/#{enrollment.student_id}/report"
    expect(response).to have_http_status(:ok)
    get "/api/formative_evaluations", params: { enrollment_id: enrollment.id }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq([])
    get "/api/students/#{enrollment.student_id}/report"
    fields = response.parsed_body.fetch("years").sole.fetch("formative_fields")
    expect(fields.find { |field| field["code"] == "languages" }["terms"]).to eq([ nil, nil, nil ])
  end
end
