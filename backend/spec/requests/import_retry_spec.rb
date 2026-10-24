require "rails_helper"
require "stringio"

RSpec.describe "import retry permissions", type: :request do
  let(:admin) { create(:user, role: "admin") }

  it "requeues a failed import once and rejects a second concurrent retry" do
    batch = admin.data_imports.new(kind: "subjects", status: "failed",
      row_errors: [ { row: 2, messages: [ "Error temporal" ] } ])
    batch.file.attach(io: StringIO.new("Nombre,Clave\nMatemáticas,MAT-SEQ\n"),
      filename: "materias.csv", content_type: "text/csv")
    batch.save!
    post "/api/session", params: { email: admin.email, password: "School-test-password-26" }, as: :json

    post "/api/data_imports/#{batch.id}/retry", as: :json
    expect(response).to have_http_status(:accepted)
    expect(batch.reload.status).to eq("queued")

    post "/api/data_imports/#{batch.id}/retry", as: :json
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "does not allow unrelated users to retry another person's failed import" do
    batch = admin.data_imports.new(kind: "subjects", status: "failed")
    batch.file.attach(io: StringIO.new("Nombre,Clave\nMateria,MAT-ERR\n"),
      filename: "materias.csv", content_type: "text/csv")
    batch.save!
    guardian = create(:user, role: "guardian")
    post "/api/session", params: { email: guardian.email, password: "School-test-password-26" }, as: :json

    post "/api/data_imports/#{batch.id}/retry", as: :json
    expect(response).to have_http_status(:forbidden)
    expect(batch.reload.status).to eq("failed")
  end
end
