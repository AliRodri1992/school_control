require "rails_helper"

RSpec.describe "polymorphic contact details", type: :model do
  let(:student) { create(:student) }

  it "attaches addresses to students and validates their country and coordinates" do
    address = student.addresses.create!(country_code: "MX", purpose: "home", line1: "Calle Reforma 1", primary: true)
    expect(address.addressable).to eq(student)
    expect(student.addresses.count).to eq(1)
    expect(student.addresses.build(country_code: "MX", line1: "Otra", latitude: 120)).not_to be_valid
  end

  it "normalizes phone numbers to strict international format" do
    expect(student.phone_numbers.create!(number_e164: "+525512345678", purpose: "mobile")).to be_persisted
    expect(student.phone_numbers.build(number_e164: "5512345678", purpose: "mobile")).not_to be_valid
  end

  it "binds pickup authorization to an individual student" do
    contact = student.contacts.create!(name: "Familiar", relationship: "Abuela", pickup_authorized: true)
    expect(contact.contactable).to eq(student)
    school = School.first_or_create!(name: "Primaria de prueba")
    expect(school.contacts.build(name: "Persona", pickup_authorized: true)).not_to be_valid
  end

  it "stores notes with an author and explicit visibility" do
    note = student.notes.create!(author: student.guardian, body: "Seguimiento administrativo", visibility: "internal")
    expect(note.notable).to eq(student)
    expect(student.notes.build(author: student.guardian, body: " ", visibility: "secret")).not_to be_valid
  end

  it "generates the displayed name without optional parts and derives birth date and sex from CURP" do
    part = "SALS850720MDFLLF0"
    values = FamilyCurp::VALUES
    sum = part.chars.each_with_index.sum { |char, index| values.index(char) * (18 - index) }
    curp = part + ((10 - sum % 10) % 10).to_s
    contact = student.contacts.create!(first_name: "María", middle_name: " Elena ",
      paternal_surname: "Salinas", maternal_surname: "Lara", curp: curp,
      legacy_phone: "5512345678", relationship: "Abuela")
    expect(contact.name).to eq("María Elena Salinas Lara")
    expect(contact.birth_date).to eq(Date.new(1985, 7, 20))
    expect(contact.sex).to eq("M")
    contact.update!(middle_name: "", maternal_surname: nil)
    expect(contact.reload.name).to eq("María Salinas")
  end

  it "preserves older name-only contacts and refuses forged date/sex" do
    contact = student.contacts.create!(name: "Familiar histórico")
    contact.update!(email: "familia@example.test")
    expect(contact.reload.name).to eq("Familiar histórico")
    contact.assign_attributes(first_name: "Ana", paternal_surname: "Flores",
      curp: "INVALIDA", legacy_phone: "5512345678", birth_date: Date.new(2000, 1, 1), sex: "H")
    expect(contact).not_to be_valid
    expect(contact.errors[:curp]).to be_present
    expect(contact.birth_date).to be_nil
    expect(contact.sex).to be_nil
  end

end
