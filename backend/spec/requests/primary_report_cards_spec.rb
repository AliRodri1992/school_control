require "rails_helper"

RSpec.describe "Versioned primary report cards", type: :request do
  let(:admin) { create(:user, role: "admin") }
  let(:enrollment) { create(:enrollment) }
  let(:student) { enrollment.student }

  def login(account)
    post "/api/session", params: { email: account.email, password: "School-test-password-26" }, as: :json
    expect(response).to have_http_status(:ok)
  end

  before do
    School.first_or_create!(name: "Primaria de prueba", code: "15DPR0000A")
    FormativeEvaluation::FIELDS.each_key do |field|
      (1..3).each do |term|
        FormativeEvaluation.create!(enrollment: enrollment, field_code: field,
          term: term, score: 8, status: "published", published_at: Time.current,
          feedback: "Desempeño registrado")
      end
    end
  end

  it "issues an immutable consultation PDF and permits authenticated reprints" do
    login(admin)
    2.times do
      post "/api/students/#{student.id}/issue_report_card",
        params: { enrollment_id: enrollment.id, term: 0 }, as: :json
      expect(response).to have_http_status(:created)
    end
    issues = enrollment.primary_report_card_issues.order(:version)
    expect(issues.pluck(:version)).to eq([1, 2])
    expect(issues.first.file.download).to start_with("%PDF")
    expect(issues.first.sha256).to eq(Digest::SHA256.hexdigest(issues.first.file.download))
    get "/api/students/#{student.id}/report_cards/#{issues.first.id}/download"
    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("application/pdf")
    expect(response.headers["Cache-Control"]).to include("no-store")
    expect(issues.first.reload.snapshot.fetch("annual_average")).to be_present
  end

  it "allows the guardian to acknowledge a issued card only for their student" do
    login(admin)
    post "/api/students/#{student.id}/issue_report_card",
      params: { enrollment_id: enrollment.id, term: 1 }, as: :json
    issue_id = response.parsed_body.fetch("id")
    login(student.guardian)
    post "/api/students/#{student.id}/report_cards/#{issue_id}/acknowledge", as: :json
    expect(response).to have_http_status(:ok)
    post "/api/students/#{student.id}/report_cards/#{issue_id}/acknowledge", as: :json
    expect(response).to have_http_status(:ok)
    expect(ReportCardAcknowledgment.where(primary_report_card_issue_id: issue_id).count).to eq(1)
  end

  it "rejects final cards before all four fields are fully published" do
    enrollment.formative_evaluations.first.destroy!
    login(admin)
    post "/api/students/#{student.id}/issue_report_card",
      params: { enrollment_id: enrollment.id, term: 0 }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(enrollment.primary_report_card_issues).to be_empty
  end

  it "does not allow guardians to issue official-looking PDFs or view unrelated pupils" do
    login(student.guardian)
    post "/api/students/#{student.id}/issue_report_card",
      params: { enrollment_id: enrollment.id, term: 0 }, as: :json
    expect(response).to have_http_status(:forbidden)
    get "/api/students/#{create(:student).id}/report_card_issues"
    expect(response).to have_http_status(:not_found).or have_http_status(:forbidden)
  end
end
