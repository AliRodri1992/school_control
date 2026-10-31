require "rails_helper"

RSpec.describe StudentContact, type: :model do
  let(:student) { create(:student) }

  def curp_for(part)
    values = FamilyCurp::VALUES
    sum = part.chars.each_with_index.sum { |char, index| values.index(char) * (18 - index) }
    part + ((10 - sum % 10) % 10).to_s
  end

  it "assembles a display name, derives data only from CURP and mirrors the identity" do
    contact = described_class.create!(student: student, first_name: "Sofía", middle_name: "Elena",
      paternal_surname: "Salinas", maternal_surname: "Lara",
      curp: curp_for("SALS850720MDFLLF0"), relationship: "Madre", phone: "5512345678")
    expect(contact.name).to eq("Sofía Elena Salinas Lara")
    expect(contact.birth_date).to eq(Date.new(1985, 7, 20))
    expect(contact.sex).to eq("M")
    mirror = Contact.find_by!(legacy_student_contact_id: contact.id)
    expect(mirror.curp).to eq(contact.curp)
    expect(mirror.birth_date).to eq(contact.birth_date)
    expect(mirror.paternal_surname).to eq("Salinas")
  end

  it "does not accept a tampered or incomplete CURP, or date/sex unrelated to its value" do
    contact = described_class.new(student: student, first_name: "Sofía", paternal_surname: "Salinas",
      curp: "INVALIDA", phone: "5512345678", relationship: "Madre",
      birth_date: Date.new(1999, 1, 1), sex: "H")
    expect(contact).not_to be_valid
    expect(contact.errors[:curp]).not_to be_empty
    expect(contact.birth_date).to be_nil
    expect(contact.sex).to be_nil
  end

  it "preserves preexisting name-only contacts until their identity is completed" do
    contact = described_class.create!(student: student, name: "Persona registrada",
      phone: "5512345678", relationship: "Tutor")
    expect(contact.first_name).to be_nil
    expect(contact.curp).to be_nil
    contact.update!(phone: "5512345679")
    expect(contact.name).to eq("Persona registrada")
  end
end
