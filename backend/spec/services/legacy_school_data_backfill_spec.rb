require "rails_helper"

RSpec.describe LegacySchoolDataBackfill do
  it "copies legacy contacts and phone numbers without creating duplicates on a second run" do
    guardian = create(:user, role: "guardian")
    student = create(:student, guardian: guardian)
    # Reproduce a pre-migration record that never triggered the new mirroring callback.
    legacy_id = StudentContact.insert!({
      student_id: student.id, name: "Mamá", relationship: "Madre",
      phone: "5512345678", email: "contacto@example.com",
      emergency: false, pickup_authorized: false,
      created_at: Time.current, updated_at: Time.current
    }, returning: %w[id]).rows.first.first
    legacy = StudentContact.find(legacy_id)
    expect(Contact.where(legacy_student_contact_id: legacy.id)).to be_empty
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

  it "immediately synchronizes new family contacts and updates" do
    student = create(:student)
    legacy = StudentContact.create!(student: student, name: "Tía", relationship: "Tía",
      phone: "5512345678")
    mirror = Contact.find_by!(legacy_student_contact_id: legacy.id)
    expect(mirror.phone_numbers.pluck(:number_e164)).to include("+525512345678")
    legacy.update!(pickup_authorized: true, phone: "5512345679")
    expect(mirror.reload.pickup_authorized).to be(true)
    expect(mirror.phone_numbers.pluck(:number_e164)).to include("+525512345679")
  end

  it "retains phone values needing human review instead of deleting them" do
    student = create(:student)
    legacy = StudentContact.create!(student: student, name: "Familiar",
      relationship: "Otro", phone: "1234567")
    described_class.new.call
    contact = Contact.find_by!(legacy_student_contact_id: legacy.id)
    expect(contact.legacy_phone).to eq(legacy.phone)
    expect(contact.phone_numbers.count).to eq(0)
  end
end
