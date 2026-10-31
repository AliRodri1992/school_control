require "rails_helper"

RSpec.describe PrimarySchoolGrading do
  let(:enrollment) { create(:enrollment) }

  def evaluated(scores)
    FormativeEvaluation::FIELDS.keys.flat_map.with_index do |field, field_index|
      scores.fetch(field_index).each_with_index.map do |score, index|
        FormativeEvaluation.new(enrollment: enrollment, field_code: field, term: index + 1,
          score: score, status: "published")
      end
    end
  end

  it "keeps missing trimesters pending and never invents an annual grade" do
    state = described_class.report(enrollment: enrollment, records: evaluated([[8, 9], [8, 9], [8, 9], [8, 9]]))
    expect(state).to include(complete: false, annual_average: nil, accredited: nil,
      recommendation: "pending", missing_evaluations: 4)
  end

  it "truncates positive decimal averages according to the cycle configuration" do
    scores = [[8, 9, 9], [9, 9, 9], [8, 8, 8], [7, 7, 7]]
    state = described_class.report(enrollment: enrollment, records: evaluated(scores))
    expect(state[:fields].first[:final]).to eq(BigDecimal("8.6"))
    expect(state[:annual_average]).to eq(BigDecimal("8.1"))
    expect(state).to include(complete: true, accredited: true, recommendation: "promoted")
  end

  it "uses the configured rounding version without mutating previous cycles" do
    enrollment.academic_year.update!(average_decimal_mode: "round_half_up")
    state = described_class.report(enrollment: enrollment, records: evaluated([[8, 9, 9], [9, 9, 9], [8, 8, 8], [7, 7, 7]]))
    expect(state[:fields].first[:final]).to eq(BigDecimal("8.7"))
  end

  it "detects nonaccreditation in grades two to six without overriding school authority" do
    enrollment.group.update!(grade_level: 3)
    state = described_class.report(enrollment: enrollment, records: evaluated([[5, 5, 5], [7, 7, 7], [8, 8, 8], [8, 8, 8]]))
    expect(state).to include(accredited: false, recommendation: "repeat")
    expect(state[:annual_average]).to eq(BigDecimal("7.0"))
  end

  it "accredits first grade for having completed the year" do
    state = described_class.report(enrollment: enrollment, records: evaluated(Array.new(4) { [6, 6, 6] }))
    expect(state).to include(accredited: true, recommendation: "promoted")
  end

  it "enforces integer marks and the minimum scale for grades one and two" do
    record = FormativeEvaluation.new(enrollment: enrollment, field_code: "languages", term: 1, score: 5)
    expect(record).not_to be_valid
    expect(record.errors[:score]).not_to be_empty
    record.score = 8.5
    expect(record).not_to be_valid
    record.score = 6
    expect(record).to be_valid
    enrollment.group.update!(grade_level: 3)
    record.score = 5
    expect(record).to be_valid
  end
end
