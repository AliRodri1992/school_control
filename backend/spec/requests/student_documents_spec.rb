require "rails_helper"

RSpec.describe "Private student documents", type: :request do
  let(:guardian) { create(:user) }
  let(:student) { create(:student, guardian: guardian) }
  let(:admin) { create(:user, role: "admin") }

  def login(account)
    post "/api/session", params: { email: account.email, password: "School-test-password-26" }, as: :json
  end

  def upload(content = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF", filename = "acta.pdf")
    Rack::Test::UploadedFile.new(StringIO.new(content), "application/pdf", original_filename: filename)
  end

  it "uploads and downloads only through authorized student access" do
    login(guardian)
    post "/api/student_documents", params: { student_id: student.id, title: "Acta", file: upload, status: "approved", uploader_id: admin.id }
    expect(response).to have_http_status(:created)
    document = StudentDocument.last
    expect(document.status).to eq("pending")
    expect(document.uploader).to eq(guardian)
    expect(response.parsed_body.keys).not_to include("file", "signed_id", "blob_id")
    get "/api/student_documents/#{document.id}/download"
    expect(response).to have_http_status(:ok)
    expect(response.headers["Cache-Control"]).to include("no-store")
    expect(response.body).to start_with("%PDF-")
    login(create(:user))
    get "/api/student_documents"
    expect(response.parsed_body).to eq([])
    get "/api/student_documents/#{document.id}/download"
    expect(response).to have_http_status(:not_found)
  end

  it "rejects spoofed content and unauthorized students" do
    login(guardian)
    post "/api/student_documents", params: { student_id: student.id, title: "Fake", file: upload("<script>alert(1)</script>") }
    expect(response).to have_http_status(:unprocessable_content)
    post "/api/student_documents", params: { student_id: create(:student).id, title: "Acta", file: upload }
    expect(response).to have_http_status(:not_found)
    expect(StudentDocument.count).to eq(0)
  end

  it "requires administration for review, a correction reason and the current version" do
    login(guardian)
    post "/api/student_documents", params: { student_id: student.id, title: "Acta", file: upload }
    document = StudentDocument.last
    post "/api/student_documents/#{document.id}/review", params: { status: "approved", lock_version: 0 }, as: :json
    expect(response).to have_http_status(:forbidden)
    login(admin)
    post "/api/student_documents/#{document.id}/review", params: { status: "correction_requested", lock_version: 0 }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    post "/api/student_documents/#{document.id}/review", params: { status: "correction_requested", review_notes: "Falta una página", lock_version: 0 }, as: :json
    expect(response).to have_http_status(:ok)
    expect(document.reload.reviewer).to eq(admin)
    post "/api/student_documents/#{document.id}/review", params: { status: "approved", lock_version: 0 }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(document.reload.status).to eq("correction_requested")
  end

  it "does not expose documents to teachers" do
    login(create(:user, role: "teacher"))
    get "/api/student_documents"
    expect(response).to have_http_status(:forbidden)
  end
end
