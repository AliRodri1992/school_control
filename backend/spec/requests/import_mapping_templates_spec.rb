require "rails_helper"

RSpec.describe "reusable import mapping templates", type: :request do
  def sign_in(user)
    post "/api/session", params: { email: user.email, password: "School-test-password-26" }, as: :json
  end

  it "keeps other administrators' saved column templates private" do
    admin = create(:user, role: "admin")
    other_admin = create(:user, role: "admin")
    ImportMappingTemplate.create!(user: other_admin, name: "Other school format",
      kind: "subjects", mapping: { "Materia" => "name", "Clave" => "code" })
    sign_in(admin)

    get "/api/import_mapping_templates"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq([])

    post "/api/import_mapping_templates", params: {
      kind: "subjects", name: "Mi formato", mapping: { "Materia" => "name", "Clave" => "code" }
    }, as: :json
    expect(response).to have_http_status(:created)
    expect(ImportMappingTemplate.last.user).to eq(admin)
  end

  it "blocks parents from creating import templates and editing other people's templates" do
    admin = create(:user, role: "admin")
    record = ImportMappingTemplate.create!(user: admin, name: "Formato general", kind: "subjects",
      mapping: { "Materia" => "name", "Clave" => "code" })
    sign_in(create(:user, role: "guardian"))

    post "/api/import_mapping_templates", params: {
      kind: "subjects", name: "Unapproved", mapping: { "Materia" => "name", "Clave" => "code" }
    }, as: :json
    expect(response).to have_http_status(:forbidden)

    delete "/api/import_mapping_templates/#{record.id}"
    expect(response).to have_http_status(:forbidden)
  end
end
