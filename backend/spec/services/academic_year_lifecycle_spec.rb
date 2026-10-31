require "rails_helper"

RSpec.describe AcademicYearLifecycle do
  let(:year) do
    create(:academic_year, starts_on: Date.new(2026, 8, 31),
      ends_on: Date.new(2027, 7, 9),
      first_term_starts_on: Date.new(2026, 8, 31), first_term_ends_on: Date.new(2026, 11, 30),
      second_term_starts_on: Date.new(2026, 12, 1), second_term_ends_on: Date.new(2027, 3, 31),
      third_term_starts_on: Date.new(2027, 4, 1), third_term_ends_on: Date.new(2027, 7, 9))
  end

  before { School.create!(name: "Primaria de prueba") }

  it "moves one step at a time after the required date and records an audit trail" do
    expect(described_class.advance!(year, today: Date.new(2026, 8, 30))).to be(false)
    expect(described_class.advance!(year, today: Date.new(2026, 9, 1))).to be(true)
    expect(year.reload.status).to eq("active")
    expect(year.status_transitions.last).to have_attributes(from_status: "draft", to_status: "active")

    expect(described_class.advance!(year, today: Date.new(2027, 7, 8))).to be(false)
    expect(described_class.advance!(year, today: Date.new(2027, 7, 9))).to be(true)
    expect(year.reload.status).to eq("closing")
    expect(described_class.advance!(year, today: Date.new(2027, 8, 8))).to be(true)
    expect(year.reload.status).to eq("closed")
    expect(described_class.advance!(year, today: Date.new(2032, 7, 9))).to be(true)
    expect(year.reload.status).to eq("archived")
    expect(described_class.advance!(year, today: Date.new(2032, 7, 10))).to be(false)
    expect(year.status_transitions.count).to eq(4)
  end

  it "does not activate when a trimester is missing and warns on groups without blocking" do
    year.update!(third_term_starts_on: nil, third_term_ends_on: nil)
    expect(described_class.advance!(year, today: Date.new(2026, 9, 1))).to be(false)
    checks = described_class.preview(year, today: Date.new(2026, 9, 1))[:critical]
    expect(checks.find { |check| check[:key] == "trimesters" }[:ok]).to be(false)
    expect(checks.find { |check| check[:key] == "groups" }[:blocking]).to be(false)
  end

  it "prevents concurrent active cycles, including a database unique index" do
    second = create(:academic_year, starts_on: Date.new(2026, 8, 31),
      ends_on: Date.new(2027, 7, 9),
      first_term_starts_on: Date.new(2026, 8, 31), first_term_ends_on: Date.new(2026, 11, 30),
      second_term_starts_on: Date.new(2026, 12, 1), second_term_ends_on: Date.new(2027, 3, 31),
      third_term_starts_on: Date.new(2027, 4, 1), third_term_ends_on: Date.new(2027, 7, 9))
    expect(described_class.advance!(year, today: Date.new(2026, 9, 1))).to be(true)
    expect(described_class.advance!(second, today: Date.new(2026, 9, 1))).to be(false)
    expect(second.reload.status).to eq("draft")
  end

  it "rejects changing status manually and established dates with linked records" do
    expect(year.update(status: "closed")).to be(false)
    expect(year.errors[:status]).to be_present
    create(:admission, academic_year: year)
    expect(year.update(starts_on: Date.new(2026, 9, 1))).to be(false)
    expect(year.errors[:base]).to be_present
  end

  it "allows applications during preparation regardless of the academic lifecycle" do
    expect(year.status).to eq("draft")
    expect(year.open_for?("new")).to eq(Date.current.between?(year.admissions_open_on, year.admissions_close_on))
  end
end
