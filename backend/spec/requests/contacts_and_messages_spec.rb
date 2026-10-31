require "rails_helper"

RSpec.describe "Family contacts and institutional messages", type: :request do
  let(:guardian) { create(:user) }
  let(:student) { create(:student, guardian: guardian) }
  let(:admin) { create(:user, role: "admin") }

  def login(account)
    post "/api/session", params: { email: account.email, password: "School-test-password-26" }, as: :json
  end

  it "requires authentication for both modules" do
    get "/api/student_contacts"
    expect(response).to have_http_status(:unauthorized)
    get "/api/messages"
    expect(response).to have_http_status(:unauthorized)
  end

  it "creates, updates and deletes an owned contact, without changing ownership" do
    login(guardian)
    post "/api/student_contacts", params: { student_id: student.id, name: "Abuela", relationship: "Abuela", phone: "+525512345678", emergency: true }, as: :json
    expect(response).to have_http_status(:created)
    contact = StudentContact.last
    shared = Contact.find_by!(legacy_student_contact_id: contact.id)
    expect(shared.contactable).to eq(student)
    patch "/api/student_contacts/#{contact.id}", params: { student_id: create(:student).id, pickup_authorized: true }, as: :json
    expect(response).to have_http_status(:ok)
    expect(contact.reload.student).to eq(student)
    expect(contact.pickup_authorized).to be(true)
    expect(shared.reload.pickup_authorized).to be(true)
    delete "/api/student_contacts/#{contact.id}"
    expect(response).to have_http_status(:no_content)
    expect(StudentContact.exists?(contact.id)).to be(false)
    expect(Contact.exists?(shared.id)).to be(false)
  end

  it "hides other families' contacts and refuses cross-family writes" do
    other = create(:student)
    contact = StudentContact.create!(student: other, name: "Tutor", relationship: "Tío", phone: "5512345678")
    login(guardian)
    get "/api/student_contacts"
    expect(response.parsed_body).to eq([])
    patch "/api/student_contacts/#{contact.id}", params: { name: "Changed" }, as: :json
    expect(response).to have_http_status(:not_found)
    post "/api/student_contacts", params: { student_id: other.id, name: "Injected" }, as: :json
    expect(response).to have_http_status(:not_found)
    delete "/api/student_contacts/#{contact.id}"
    expect(response).to have_http_status(:not_found)
  end

  it "clears obsolete normalized phone numbers when the source number becomes invalid" do
    legacy = StudentContact.create!(student: student, name: "Tía", relationship: "Tía", phone: "5512345678")
    mirror = Contact.find_by!(legacy_student_contact_id: legacy.id)
    expect(mirror.phone_numbers.count).to eq(1)
    legacy.update!(phone: "1234567")
    expect(mirror.reload.legacy_phone).to eq("1234567")
    expect(mirror.phone_numbers.count).to eq(0)
  end

  it "rejects duplicate and malformed contacts" do
    login(guardian)
    attrs = { student_id: student.id, name: "Tutor", relationship: "Tío", phone: "5512345678" }
    post "/api/student_contacts", params: attrs, as: :json
    post "/api/student_contacts", params: attrs, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    post "/api/student_contacts", params: attrs.merge(phone: "bad"), as: :json
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "does not expose pickup contacts to teachers or students" do
    %w[ teacher student ].each do |role|
      login(create(:user, role: role))
      get "/api/student_contacts"
      expect(response).to have_http_status(:forbidden)
    end
  end

  it "lets a family contact administration, preserving sender and unread state" do
    login(guardian)
    post "/api/messages", params: { recipient_id: admin.id, sender_id: admin.id, subject: "Consulta", body: "Buenos días", read_at: Time.current }, as: :json
    expect(response).to have_http_status(:created)
    message = InstitutionalMessage.last
    expect(message.sender).to eq(guardian)
    expect(message.read_at).to be_nil
    post "/api/messages/#{message.id}/read"
    expect(response).to have_http_status(:not_found)
    login(admin)
    post "/api/messages/#{message.id}/read"
    expect(response).to have_http_status(:ok)
    timestamp = message.reload.read_at
    travel 1.minute do
      post "/api/messages/#{message.id}/read"
      expect(message.reload.read_at).to eq(timestamp)
    end
    expect(AuditEvent.where(action: "message.read", record_id: message.id).count).to eq(1)
  end

  it "prevents messaging unrelated families and teachers, and excludes inactive recipients" do
    login(guardian)
    [ create(:user), create(:user, role: "teacher"), create(:user, role: "admin", active: false) ].each do |recipient|
      post "/api/messages", params: { recipient_id: recipient.id, subject: "Hi", body: "Hello" }, as: :json
      expect(response).to have_http_status(:not_found)
    end
    expect(InstitutionalMessage.count).to eq(0)
  end

  it "allows communication with the assigned teacher and hides other conversations" do
    enrollment = create(:enrollment, student: student, admission: create(:admission, student: student))
    course = create(:course, group: enrollment.group)
    login(guardian)
    post "/api/messages", params: { recipient_id: course.teacher.id, subject: "Tarea", body: "Consulta de clase" }, as: :json
    expect(response).to have_http_status(:created)
    login(course.teacher)
    get "/api/messages/recipients"
    expect(response.parsed_body.map { |person| person["id"] }).to include(guardian.id)
    get "/api/messages"
    expect(response.parsed_body.length).to eq(1)
    login(create(:user))
    get "/api/messages"
    expect(response.parsed_body).to eq([])
  end

  it "stores a structured family identity and derives protected demographics from CURP" do
    login(guardian)
    part = "SALS850720MDFLLF0"
    weights = FamilyCurp::VALUES
    sum = part.chars.each_with_index.sum { |char, index| weights.index(char) * (18 - index) }
    curp = part + ((10 - sum % 10) % 10).to_s
    post "/api/student_contacts", params: { student_id: student.id,
      first_name: "Sofía", middle_name: "Elena", paternal_surname: "Salinas",
      maternal_surname: "Lara", curp: curp.downcase, relationship: "Madre",
      phone: "+525512345678", sex: "H", birth_date: "1990-01-01" }, as: :json
    expect(response).to have_http_status(:created)
    data = response.parsed_body
    expect(data["name"]).to eq("Sofía Elena Salinas Lara")
    expect(data["curp"]).to eq(curp)
    expect(data).not_to have_key("sex")
    expect(data).not_to have_key("birth_date")
    contact = StudentContact.find(data.fetch("id"))
    expect(contact.birth_date).to eq(Date.new(1985, 7, 20))
    expect(contact.sex).to eq("M")

    patch "/api/student_contacts/#{contact.id}", params: { relationship: "Tutora",
      sex: "H", birth_date: "2001-01-01", student_id: create(:student).id }, as: :json
    expect(response).to have_http_status(:ok)
    expect(contact.reload.student).to eq(student)
    expect(contact.birth_date).to eq(Date.new(1985, 7, 20))
    expect(contact.sex).to eq("M")
  end

  it "rejects structurally invalid CURP and incomplete structured identities" do
    login(guardian)
    post "/api/student_contacts", params: { student_id: student.id, first_name: "Sofía",
      paternal_surname: "Salinas", curp: "INVALIDA",
      relationship: "Madre", phone: "5512345678" }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(StudentContact.where(student: student).count).to eq(0)
  end

  it "returns structured identity in a fresh GET after editing and clearing optional names" do
    login(guardian)
    part = "SALS850720MDFLLF0"
    sum = part.chars.each_with_index.sum { |char, i| FamilyCurp::VALUES.index(char) * (18 - i) }
    curp = part + ((10 - sum % 10) % 10).to_s
    post "/api/student_contacts", params: { student_id: student.id, first_name: "Sofía",
      middle_name: "Elena", paternal_surname: "Salinas", maternal_surname: "Lara",
      curp: curp, relationship: "Madre", phone: "5512345678" }, as: :json
    expect(response).to have_http_status(:created)
    id = response.parsed_body.fetch("id")

    patch "/api/student_contacts/#{id}", params: { first_name: "Sofía",
      middle_name: "", paternal_surname: "Salinas", maternal_surname: "",
      curp: curp, relationship: "Madre", phone: "5512345678" }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include("name" => "Sofía Salinas", "first_name" => "Sofía",
      "paternal_surname" => "Salinas", "middle_name" => nil, "maternal_surname" => nil, "curp" => curp)

    get "/api/student_contacts/#{id}"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include("name" => "Sofía Salinas", "first_name" => "Sofía",
      "middle_name" => nil, "paternal_surname" => "Salinas", "maternal_surname" => nil, "curp" => curp)
    get "/api/student_contacts"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.find { |row| row["id"] == id }).to include(
      "name" => "Sofía Salinas", "first_name" => "Sofía", "paternal_surname" => "Salinas")
  end

  it "does not allow unrelated families to open another contact via the detail endpoint" do
    other = create(:student)
    contact = StudentContact.create!(student: other, name: "Otra persona",
      relationship: "Tía", phone: "5512345678")
    login(guardian)
    get "/api/student_contacts/#{contact.id}"
    expect(response).to have_http_status(:not_found)
  end
end
