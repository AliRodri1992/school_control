require "rails_helper"

RSpec.describe "shared school communication and schedules", type: :request do
  def login(person)
    post "/api/session", params: { email: person.email, password: "School-test-password-26" }, as: :json
  end

  it "filters announcements by the audience of the logged-in portal" do
    teacher = create(:user, role: "teacher")
    Announcement.create!(title: "Docentes", body: "Reunión", audience: "teacher")
    Announcement.create!(title: "Familias", body: "Circular", audience: "guardian")
    Announcement.create!(title: "General", body: "Información", audience: "all")
    login(teacher)
    get "/api/announcements"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.pluck("title")).to contain_exactly("Docentes", "General")
  end

  it "allows families to view school-wide events but not a different group's events" do
    guardian = create(:user, role: "guardian")
    student = create(:student, guardian: guardian)
    admission = create(:admission, student: student)
    own = create(:enrollment, student: student, admission: admission)
    event_a = CalendarEvent.create!(academic_year: own.academic_year, title: "Todo el ciclo",
      kind: "activity", starts_at: 2.days.from_now, ends_at: 3.days.from_now)
    event_b = CalendarEvent.create!(academic_year: own.academic_year, group: create(:group, academic_year: own.academic_year),
      title: "Otro grupo", kind: "exam", starts_at: 5.days.from_now, ends_at: 6.days.from_now)
    login(guardian)
    get "/api/calendar_events"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.pluck("id")).to include(event_a.id)
    expect(response.parsed_body.pluck("id")).not_to include(event_b.id)
  end

  it "prevents teachers from deleting calendar events and announcements" do
    login(create(:user, role: "teacher"))
    delete "/api/calendar_events/10"
    expect(response).to have_http_status(:forbidden)
    delete "/api/announcements/10"
    expect(response).to have_http_status(:forbidden)
  end

  it "provides schedule visibility for the teacher's assigned course only" do
    teacher = create(:user, role: "teacher")
    own = create(:course, teacher: teacher)
    my_slot = create(:schedule_slot, course: own)
    outside = create(:schedule_slot)
    login(teacher)
    get "/api/schedule_slots"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.pluck("id")).to include(my_slot.id)
    expect(response.parsed_body.pluck("id")).not_to include(outside.id)
  end
end
