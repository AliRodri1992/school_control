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
end
