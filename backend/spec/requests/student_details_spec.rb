require "rails_helper"

RSpec.describe "polymorphic student details", type: :request do
  let(:student) { create(:student) }
  let(:admin) { create(:user, role: "admin") }
  let(:guardian) { student.guardian }

  def login(person)
    post "/api/session", params: { email: person.email, password: "School-test-password-26" }, as: :json
  end

  it "requires authentication for the student record" do
    get "/api/students/#{student.id}/details/addresses"
    expect(response).to have_http_status(:unauthorized)
  end

  it "rejects unknown kinds" do
    login(admin)
    get "/api/students/#{student.id}/details/invalid"
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "promotes one address as primary without violating the unique database index" do
    login(admin)
    first = student.addresses.create!(line1: "Primera", country_code: "MX", purpose: "home", primary: true)
    second = student.addresses.create!(line1: "Segunda", country_code: "MX", purpose: "home", primary: false)
    patch "/api/students/#{student.id}/details/addresses/#{second.id}",
      params: { primary: true, line1: "Segunda actualizada" }, as: :json
    expect(response).to have_http_status(:ok)
    expect(first.reload.primary).to be(false)
    expect(second.reload.primary).to be(true)
    expect(second.line1).to eq("Segunda actualizada")
  end

  it "maintains only one primary phone number per purpose" do
    login(admin)
    student.phone_numbers.create!(number_e164: "+525512345678", country_code: "MX",
      purpose: "mobile", primary: true)
    post "/api/students/#{student.id}/details/phones",
      params: { number_e164: "+525512345679", country_code: "MX", purpose: "mobile", primary: true }, as: :json
    expect(response).to have_http_status(:created)
    expect(student.phone_numbers.where(primary: true, purpose: "mobile").count).to eq(1)
    expect(student.phone_numbers.find_by!(primary: true, purpose: "mobile").number_e164).to eq("+525512345679")
  end

  it "prevents edits to contacts mirrored from the legacy module" do
    legacy = StudentContact.create!(student: student, name: "Madre", relationship: "Mamá", phone: "5512345678")
    mirror = Contact.find_by!(legacy_student_contact_id: legacy.id)
    login(guardian)
    patch "/api/students/#{student.id}/details/contacts/#{mirror.id}", params: { name: "Inyectado" }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    delete "/api/students/#{student.id}/details/contacts/#{mirror.id}"
    expect(response).to have_http_status(:unprocessable_content)
    expect(mirror.reload.name).to eq("Madre")
  end

  it "does not reveal internal notes to guardians but supports explicitly shared notes" do
    student.notes.create!(body: "Observación interna", category: "seguimiento", author: admin, visibility: "internal")
    shared = student.notes.create!(body: "Compartido", category: "general", author: admin, visibility: "shared")
    login(guardian)
    get "/api/students/#{student.id}/details/notes"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.pluck("id")).to eq([ shared.id ])
    post "/api/students/#{student.id}/details/notes", params: { body: "Intento", visibility: "shared" }, as: :json
    expect(response).to have_http_status(:not_found).or have_http_status(:forbidden)
  end

  it "rejects access to records of an unrelated family" do
    login(create(:user, role: "guardian"))
    get "/api/students/#{student.id}/details/contacts"
    expect(response).to have_http_status(:not_found)
  end
end

RSpec.describe "typed student detail notifications", type: :request do
  let(:admin) { create(:user, role: "admin") }
  let(:student) { create(:student) }
  before { post "/api/session", params: { email: admin.email, password: "School-test-password-26" }, as: :json }
  it "notifies the acting administrator when a note is created, updated and deleted" do
    post "/api/students/#{student.id}/details/notes", params: { body: "Observación escolar", visibility: "internal" }, as: :json
    expect(response).to have_http_status(:created)
    id = response.parsed_body.fetch("id")
    patch "/api/students/#{student.id}/details/notes/#{id}", params: { body: "Seguimiento actualizado" }, as: :json
    expect(response).to have_http_status(:ok)
    delete "/api/students/#{student.id}/details/notes/#{id}", as: :json
    expect(response).to have_http_status(:no_content)
    get "/api/notifications", as: :json
    items = response.parsed_body.fetch("items")
    expect(items.map { |item| item["notification_type"] }).to include("created", "updated", "deleted")
    expect(items.map { |item| item["title"] }).to include("Nota creada exitosamente", "Nota actualizada exitosamente", "Nota eliminada exitosamente")
  end
end
