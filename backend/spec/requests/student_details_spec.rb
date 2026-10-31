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

  it "persists a dossier contact's four name fields and derives CURP data on create and edit" do
    login(admin)
    part = "SALS850720MDFLLF0"
    values = FamilyCurp::VALUES
    sum = part.chars.each_with_index.sum { |char, index| values.index(char) * (18 - index) }
    curp = part + ((10 - sum % 10) % 10).to_s
    post "/api/students/#{student.id}/details/contacts", params: {
      first_name: "Sofía", middle_name: "Elena", paternal_surname: "Salinas",
      maternal_surname: "Lara", curp: curp.downcase, relationship: "Madre",
      legacy_phone: "5512345678", email: "Sofia@EXAMPLE.test", emergency: true,
      pickup_authorized: true, primary: true, birth_date: "2002-01-01", sex: "H"
    }, as: :json
    expect(response).to have_http_status(:created)
    record = Contact.find(response.parsed_body.fetch("id"))
    expect(record.name).to eq("Sofía Elena Salinas Lara")
    expect(record.curp).to eq(curp)
    expect(record.birth_date).to eq(Date.new(1985, 7, 20))
    expect(record.sex).to eq("M")
    expect(response.parsed_body).not_to have_key("birth_date")
    expect(response.parsed_body).not_to have_key("sex")
    expect(record.email).to eq("sofia@example.test")

    patch "/api/students/#{student.id}/details/contacts/#{record.id}",
      params: { first_name: "Sofía", middle_name: "", paternal_surname: "Salinas",
        maternal_surname: "", curp: curp, relationship: "Tutora",
        legacy_phone: "5512345699", birth_date: "1990-01-01", sex: "H" }, as: :json
    expect(response).to have_http_status(:ok)
    get "/api/students/#{student.id}/details/contacts/#{record.id}"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include(
      "first_name" => "Sofía", "middle_name" => nil, "paternal_surname" => "Salinas",
      "maternal_surname" => nil, "name" => "Sofía Salinas", "curp" => curp,
      "legacy_phone" => "5512345699")
    expect(record.reload.birth_date).to eq(Date.new(1985, 7, 20))
    expect(record.sex).to eq("M")
    get "/api/students/#{student.id}/details/contacts", params: { page: 1, q: "Salinas" }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("items").first.fetch("name")).to eq("Sofía Salinas")
    get "/api/students/#{student.id}/details/contacts", params: { page: 1, q: curp }
    expect(response.parsed_body.fetch("total")).to eq(1)
  end

  it "rejects malformed CURP and prevents student reassignment from the dossier API" do
    login(admin)
    post "/api/students/#{student.id}/details/contacts", params: {
      first_name: "Sofía", paternal_surname: "Salinas", curp: "INVALIDA",
      legacy_phone: "5512345678", contactable_id: create(:student).id, contactable_type: "User"
    }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(student.contacts.where(first_name: "Sofía")).to be_empty
  end

  it "limits the new contact detail read to the student's authorized dossier" do
    another = create(:student)
    person = another.contacts.create!(name: "Persona externa")
    login(admin)
    get "/api/students/#{student.id}/details/contacts/#{person.id}"
    expect(response).to have_http_status(:not_found)
    login(create(:user, role: "guardian"))
    get "/api/students/#{student.id}/details/contacts/#{person.id}"
    expect(response).to have_http_status(:not_found)
  end

  it "keeps legacy mirrored records protected from direct dossier edits" do
    legacy = StudentContact.create!(student: student, name: "Familiar previo",
      phone: "5512345678", relationship: "Tutora")
    mirror = Contact.find_by!(legacy_student_contact_id: legacy.id)
    login(admin)
    patch "/api/students/#{student.id}/details/contacts/#{mirror.id}",
      params: { first_name: "Inyectada", paternal_surname: "No permitida" }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(mirror.reload.first_name).to be_nil
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
    expect(items.map { |item| item["notification_type"] }).to include("Nota")
    expect(items.map { |item| item["title"] }).to include("Nota creada exitosamente", "Nota actualizada exitosamente", "Nota eliminada exitosamente")
  end
end

RSpec.describe "paginated student dossier collections", type: :request do
  let(:student) { create(:student) }
  let(:admin) { create(:user, role: "admin") }

  before do
    post "/api/session", params: { email: admin.email, password: "School-test-password-26" }, as: :json
  end

  it "paginates notes with a truthful count and no silent hundred-record truncation" do
    19.times do |index|
      student.notes.create!(body: "Seguimiento escolar #{index + 1}", category: "academic",
        visibility: "internal", author: admin)
    end

    get "/api/students/#{student.id}/details/notes", params: { page: 2, per_page: 8 }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include("total" => 19, "page" => 2,
      "per_page" => 8, "total_pages" => 3)
    expect(response.parsed_body.fetch("items").length).to eq(8)
  end

  it "filters contacts by authorization and searches across names" do
    student.contacts.create!(name: "María García", emergency: true, pickup_authorized: false)
    student.contacts.create!(name: "José López", emergency: false, pickup_authorized: true)
    get "/api/students/#{student.id}/details/contacts",
      params: { page: 1, q: "María", flag: "emergency" }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("total")).to eq(1)
    expect(response.parsed_body.fetch("items").first.fetch("name")).to eq("María García")
  end

  it "restricts notes by visibility before applying search or pagination" do
    student.notes.create!(body: "Nota confidencial", category: "general", visibility: "internal", author: admin)
    student.notes.create!(body: "Nota compartida", category: "general", visibility: "shared", author: admin)
    get "/api/students/#{student.id}/details/notes",
      params: { page: 1, type: "shared", sort: "oldest" }
    expect(response.parsed_body).to include("total" => 1)
    expect(response.parsed_body.fetch("items").first.fetch("body")).to eq("Nota compartida")
  end
end

RSpec.describe "Student dossier OpenAPI filtering contract" do
  it "declares the pagination and per-section filter parameter types" do
    schema = JSON.parse(Rails.root.join("openapi/v1.json").read)
    %w[addresses phones contacts notes].each do |kind|
      operation = schema.fetch("paths").fetch("/api/students/{student_id}/details/#{kind}").fetch("get")
      parameters = operation.fetch("parameters").index_by { |entry| entry.fetch("name") }
      expect(parameters.fetch("page").dig("schema", "type")).to eq("integer")
      expect(parameters.fetch("per_page").dig("schema", "enum")).to eq([ 8, 16, 24 ])
      expect(parameters.fetch("q").dig("schema", "type")).to eq("string")
    end
  end
end
