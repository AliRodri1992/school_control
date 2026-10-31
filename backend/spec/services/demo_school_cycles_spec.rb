require "rails_helper"
require Rails.root.join("db/demo_school_cycles")

RSpec.describe DemoSchoolCycles do
  before do
    allow(Rails.env).to receive(:development?).and_return(true)
    School.create!(name: "Primaria de prueba")
  end

  let(:year) { described_class.current!(start_year: 2026, today: Date.new(2026, 10, 31)) }

  it "configures all three terms, capture windows and administrative dates before enrollment" do
    cycle = year
    expect(cycle.status).to eq("draft")
    expect(cycle.starts_on).to eq(Date.new(2026, 8, 31))
    expect(cycle.ends_on).to eq(Date.new(2027, 7, 9))
    expect(cycle.administrative_closes_on).to eq(Date.new(2027, 8, 8))
    expect(cycle.archive_on).to eq(Date.new(2032, 7, 9))
    expect(cycle).to be_valid
    expect(cycle.evaluation_periods.count { |period| period[:starts_on] && period[:ends_on] }).to eq(3)
    AcademicYear::EVALUATION_PERIODS.each do |term|
      expect(cycle.public_send("#{term}_term_capture_opens_on")).to be_present
      expect(cycle.public_send("#{term}_term_capture_closes_on")).to be_present
      expect(cycle.public_send("#{term}_term_review_on")).to be_present
      expect(cycle.public_send("#{term}_term_reports_on")).to be_present
    end
    expect(described_class.current!(start_year: 2026).id).to eq(cycle.id)
    expect(AcademicYear.where(name: cycle.name).count).to eq(1)
  end

  it "prepares the future year without activating it and allows draft preinscriptions" do
    next_year = described_class.next!(current: year)
    guardian = create(:user, role: "guardian")
    application = described_class.seed_future_application!(year: next_year, guardian: guardian)
    expect(application.reload.status).to eq("draft")
    expect(next_year.status).to eq("draft")
    expect(next_year.admissions_open_on).to be < next_year.starts_on
    expect(next_year.evaluation_periods.count { |period| period[:starts_on] }).to eq(3)
    described_class.seed_future_application!(year: next_year, guardian: guardian)
    expect(next_year.admissions.count).to eq(1)
  end

  it "creates only fictional, all-day school calendar exclusions, idempotently" do
    2.times { described_class.seed_calendar!(year) }
    expect(year.calendar_events.count).to eq(4)
    expect(year.calendar_events.all? { |item| item.all_day && !item.official }).to be(true)
    expect(year.calendar_events.pluck(:kind)).to include("cte", "vacation", "suspension")
  end

  it "moves completed historical demonstrations before activating the current year" do
    historical = described_class.historical!(current: year, offset: 2)
    upcoming = described_class.next!(current: year)
    described_class.finalize!(current: year, upcoming: upcoming)
    expect(historical.reload.status).to eq("closed")
    expect(historical.status_transitions.pluck(:to_status)).to eq(%w[active closing closed])
    expect(year.reload.status).to eq("active")
    expect(year.status_transitions.pluck(:to_status)).to eq([ "active" ])
    expect(upcoming.reload.status).to eq("draft")
    described_class.finalize!(current: year, upcoming: upcoming)
    expect(historical.status_transitions.count).to eq(3)
    expect(year.status_transitions.count).to eq(1)
  end
end
