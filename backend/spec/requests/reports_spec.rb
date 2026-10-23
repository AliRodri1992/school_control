require "rails_helper"

RSpec.describe "Report previews and private exports", type: :request do
  let(:admin) { create(:user, role: "admin") }
  let(:enrollment) { create(:enrollment) }
  let(:course) { create(:course, group: enrollment.group) }

  def login(user)
    post "/api/session", params: { email: user.email, password: "School-test-password-26" }, as: :json
  end

  def create_export(format = "xlsx")
    post "/api/reports", params: { kind: "enrollments", file_format: format }, as: :json
    expect(response).to have_http_status(:accepted)
    ReportExport.find(response.parsed_body.fetch("id"))
  end

  it "scopes previews and excludes unpublished grades from family reports" do
    Grade.create!(course: course, enrollment: enrollment, term: 1, score: 8)
    create(:enrollment)
    login(enrollment.student.guardian)
    get "/api/reports/preview", params: { kind: "enrollments" }
    expect(response.parsed_body.fetch("total")).to eq(1)
    get "/api/reports/preview", params: { kind: "grades" }
    expect(response.parsed_body.fetch("total")).to eq(0)
    get "/api/reports/preview", params: { kind: "audit" }
    expect(response).to have_http_status(:forbidden)
    post "/api/reports", params: { kind: "enrollments", file_format: "xlsx" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "creates a real Excel file treating formula-like names as text and records generation" do
    enrollment.student.update!(first_name: '=HYPERLINK("https://example.test")')
    login(admin)
    export = create_export
    ReportExportJob.perform_now(export.id)
    expect(export.reload.status).to eq("ready")
    Zip::File.open_buffer(export.file.download) do |zip|
      xml = Nokogiri::XML(zip.read("xl/worksheets/sheet1.xml"))
      expect(xml.xpath("//*[local-name()='f']")).to be_empty
      expect(xml.text).to include("HYPERLINK")
    end
    get "/api/reports/#{export.id}/download"
    expect(response).to have_http_status(:ok)
    expect(response.headers["Content-Type"]).to include("spreadsheetml")
    expect(AuditEvent.where(action: "report.generated", record_id: export.id)).to exist
  end

  it "generates a PDF with empty data and supports every report definition" do
    login(admin)
    export = create_export("pdf")
    ReportExportJob.perform_now(export.id)
    expect(export.reload.status).to eq("ready")
    expect(export.file.download).to start_with("%PDF")
    SchoolReport::TYPES.each_key do |kind|
      get "/api/reports/preview", params: { kind: kind }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to have_key("headers")
    end
  end

  it "revalidates revocation before generation and download" do
    login(admin)
    export = create_export
    ReportExportJob.perform_now(export.id)
    queued = create_export
    admin.access_roles.first.role_permissions.find_by!(key: "report_enrollments.xlsx").destroy!
    get "/api/reports/#{export.id}/download"
    expect(response).to have_http_status(:forbidden)
    ReportExportJob.perform_now(queued.id)
    expect(queued.reload.status).to eq("failed")
    expect(queued.file).not_to be_attached
  end

  it "denies other accounts and expired files even if they have the same permissions" do
    login(admin)
    export = create_export
    ReportExportJob.perform_now(export.id)
    login(create(:user, role: "admin"))
    get "/api/reports/#{export.id}/download"
    expect(response).to have_http_status(:not_found)
    login(admin)
    export.update!(expires_at: 1.minute.ago)
    get "/api/reports/#{export.id}/download"
    expect(response).to have_http_status(:forbidden)
  end

  it "rejects unsupported filters and inverted dates without silent filtering" do
    login(admin)
    get "/api/reports/preview", params: { kind: "admissions", group_id: 1 }
    expect(response).to have_http_status(:unprocessable_content)
    get "/api/reports/preview", params: { kind: "attendances", from: "2026-10-10", to: "2026-09-01" }
    expect(response).to have_http_status(:unprocessable_content)
  end
end
