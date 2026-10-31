require "rails_helper"

RSpec.describe FormativeEvidence do
  let(:enrollment) { create(:enrollment) }
  let(:teacher) { create(:user, role: "teacher") }

  it "produces only a reference when evidence weights reach 100 percent" do
    evidences = [
      described_class.create!(enrollment: enrollment, author: teacher,
        field_code: "languages", term: 1, kind: "project", title: "Proyecto de lectura", weight: 60, score: 9),
      described_class.create!(enrollment: enrollment, author: teacher,
        field_code: "languages", term: 1, kind: "exam", title: "Examen de lectura", weight: 40, score: 8)
    ]
    expect(described_class.reference(evidences)).to eq(BigDecimal("8.6"))
    expect(described_class.reference([evidences.first])).to be_nil
    expect(enrollment.formative_evaluations).to be_empty
  end

  it "rejects excessive weights and evidence in completed enrollments" do
    evidence = described_class.new(enrollment: enrollment, author: teacher,
      field_code: "science", term: 2, kind: "rubric", title: "Rúbrica",
      weight: 120, score: 8)
    expect(evidence).not_to be_valid
    evidence.weight = 100
    expect(evidence).to be_valid
    enrollment.update!(status: "completed", outcome: "promoted")
    expect(evidence).not_to be_valid
  end
end
