require "rails_helper"

RSpec.describe FormativeEvaluation do
  it "limits a field to one evaluation per trimester and enrollment" do
    enrollment = create(:enrollment)
    record = described_class.create!(enrollment: enrollment, field_code: "languages", term: 1, score: 8)
    duplicate = described_class.new(enrollment: enrollment, field_code: "languages", term: 1, score: 9)
    expect(duplicate).not_to be_valid
    expect(record).to be_persisted
  end

  it "does not invent a final result when the third trimester is missing" do
    enrollment = create(:enrollment)
    marks = [ 8, 9 ].each_with_index.map do |score, index|
      described_class.new(enrollment: enrollment, field_code: "languages", term: index + 1, score: score, status: "published")
    end
    expect(described_class.summary(marks).find { |field| field[:code] == "languages" }[:final]).to be_nil
  end

  it "calculates the displayed final example only when all three terms are published" do
    enrollment = create(:enrollment)
    marks = [ 8, 9, 10 ].each_with_index.map do |score, index|
      described_class.new(enrollment: enrollment, field_code: "languages", term: index + 1, score: score, status: "published")
    end
    expect(described_class.summary(marks).find { |field| field[:code] == "languages" }[:final]).to eq(9.0)
  end
end
