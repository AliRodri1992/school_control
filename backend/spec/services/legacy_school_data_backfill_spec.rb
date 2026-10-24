require "rails_helper"

RSpec.describe LegacySchoolDataBackfill do
  it "copies legacy contacts and phone numbers without creating duplicates on a second run" do
    guardian = create(:user, role: "guardian")
    student = create(:student, guardian: guardian)
    legacy = StudentContact.create!(student: student, name: "Mamá", relationship: "Madre",
      phone: "5512345678", email: "contacto@example.com")
    first = described_class.new.call
    expect(first[:contacts]).to eq(1)
    contact = Contact.find_by!(legacy_student_contact_id: legacy.id)
    expect(contact.legacy_phone).to eq("5512345678")
    expect(contact.phone_numbers.pluck(:number_e164)).to include("+525512345678")
    second = described_class.new.call
    expect(second[:contacts]).to eq(0)
    expect(Contact.where(legacy_student_contact_id: legacy.id).count).to eq(1)
    expect(contact.phone_numbers.count).to eq(1)
  end

  it "retains phone values needing human review instead of deleting them" do
    student = create(:student)
    legacy = StudentContact.create!(student: student, name: "Familiar",
      relationship: "Otro", phone: "ext. 12345")
    described_class.new.call
    contact = Contact.find_by!(legacy_student_contact_id: legacy.id)
    expect(contact.legacy_phone).to eq(legacy.phone)
    expect(contact.phone_numbers.count).to eq(0)
  end
end
