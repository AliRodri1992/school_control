require "rails_helper"

RSpec.describe EmailTemplate, type: :model do
  it "preserves a revision snapshot when institutional content changes" do
    template = described_class.activity
    template.save!
    template.update!(heading: "Nuevo encabezado institucional")
    expect(template.revision).to eq(2)
    snapshot = template.email_template_versions.first
    expect(snapshot.revision).to eq(1)
    expect(snapshot.snapshot.fetch("heading")).not_to eq("Nuevo encabezado institucional")
  end

  it "does not allow duplicated template names within one language" do
    described_class.activity.save!
    other = described_class.activity.dup
    expect(other).not_to be_valid
  end
end
