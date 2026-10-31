require "rails_helper"

RSpec.describe AcademicYear do
  let(:year) { build(:academic_year, starts_on: Date.new(2026, 8, 24), ends_on: Date.new(2027, 7, 16)) }

  it "exposes three ordered evaluation periods" do
    year.assign_attributes(first_term_starts_on: Date.new(2026, 8, 24), first_term_ends_on: Date.new(2026, 11, 27), second_term_starts_on: Date.new(2026, 11, 28), second_term_ends_on: Date.new(2027, 3, 26), third_term_starts_on: Date.new(2027, 3, 27), third_term_ends_on: Date.new(2027, 7, 16))
    expect(year).to be_valid
    expect(year.evaluation_periods.map { |period| period[:term] }).to eq([1, 2, 3])
  end

  it "rejects overlapping terms" do
    year.assign_attributes(first_term_starts_on: Date.new(2026, 8, 24), first_term_ends_on: Date.new(2026, 11, 27), second_term_starts_on: Date.new(2026, 11, 27), second_term_ends_on: Date.new(2027, 3, 26))
    expect(year).not_to be_valid
    expect(year.errors[:second_term_starts_on]).not_to be_empty
  end
end
