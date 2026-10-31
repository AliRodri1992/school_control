require "rails_helper"

RSpec.describe "Academic calendar configuration" do
  let(:year) { build(:academic_year, starts_on: Date.new(2026, 8, 31), ends_on: Date.new(2027, 7, 9)) }

  it "allows documented SEP calendar metadata without importing events" do
    year.assign_attributes(status: "draft", calendar_source: "sep",
      calendar_source_url: "https://calendarioescolar.sep.gob.mx/", planned_school_days: 185,
      calendar_source_reference: "Calendario SEP 2026-2027")
    expect(year).to be_valid
    expect(year.calendar_events).to be_empty
  end

  it "rejects invalid term capture dates and impossible school day totals" do
    year.assign_attributes(planned_school_days: 400,
      first_term_capture_opens_on: Date.new(2026, 11, 27),
      first_term_capture_closes_on: Date.new(2026, 11, 20))
    expect(year).not_to be_valid
    expect(year.errors[:first_term_capture_closes_on]).to be_present
    expect(year.errors[:planned_school_days]).to be_present
  end

  it "does not destroy a cycle with related groups" do
    year.save!
    create(:group, academic_year: year)
    expect(year.destroy).to be_falsey
    expect(AcademicYear.exists?(year.id)).to be(true)
  end

  it "accepts structured official CTE events and rejects mismatched groups" do
    year.save!
    event = CalendarEvent.new(academic_year: year, title: "Consejo Técnico Escolar",
      kind: "cte", source_type: "sep", official: true, all_day: true,
      starts_at: Time.zone.local(2026, 10, 30), ends_at: Time.zone.local(2026, 10, 31))
    expect(event).to be_valid
    event.group = create(:group)
    expect(event).not_to be_valid
  end

  it "generates a real PDF summary" do
    year.save!
    expect(AcademicYearPdf.new(year).render).to start_with("%PDF")
  end
end
