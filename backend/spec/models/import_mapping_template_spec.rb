require "rails_helper"

RSpec.describe ImportMappingTemplate, type: :model do
  let(:admin) { create(:user, role: "admin") }

  it "stores a reusable user-scoped mapping without duplicate target columns" do
    item = described_class.create!(user: admin, name: "SEP tradicional", kind: "students",
      mapping: { "Nombre" => "first_name", "Apellidos" => "last_name",
        "CURP" => "curp", "Nacimiento" => "birth_date", "Email tutor" => "guardian_email" })
    expect(item.reload.mapping["Nombre"]).to eq("first_name")
    item.mapping["Alias"] = "first_name"
    expect(item).not_to be_valid
  end

  it "requires validated source-to-target columns before saving a template" do
    item = described_class.new(user: admin, name: "Incomplete", kind: "grades",
      mapping: { "Nota" => "score" })
    expect(item).not_to be_valid
    expect(item.errors[:mapping]).to be_present
  end
end
