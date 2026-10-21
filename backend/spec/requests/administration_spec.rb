require "rails_helper"

RSpec.describe "Administration workflows", type: :request do
  let(:admin) { create(:user, role: "admin") }

  before do
    post "/api/session", params: { email: admin.email, password: "School-test-password-26" }, as: :json
  end

  it "configures school identity" do
    School.create!(name: "Original")
    patch "/api/school", params: { name: "Primaria Horizonte", code: "DEMO" }, as: :json
    expect(response).to have_http_status(:ok)
    get "/api/school"
    expect(response.parsed_body["name"]).to eq("Primaria Horizonte")
  end

  it "creates a group and updates its capacity" do
    year = create(:academic_year)
    post "/api/groups", params: { academic_year_id: year.id, grade_level: 2, section: "B", capacity: 25 }, as: :json
    expect(response).to have_http_status(:created)
    id = response.parsed_body["id"]
    patch "/api/groups/#{id}", params: { capacity: 28 }, as: :json
    expect(response).to have_http_status(:ok)
    get "/api/groups"
    expect(response.parsed_body.first["capacity"]).to eq(28)
  end

  it "prevents changing a group's identity once it has academic history" do
    enrollment = create(:enrollment)
    patch "/api/groups/#{enrollment.group_id}", params: { grade_level: 5 }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(enrollment.group.reload.grade_level).to eq(1)
  end

  it "creates and lists a subject and class" do
    group = create(:group)
    teacher = create(:user, role: "teacher")
    post "/api/subjects", params: { name: "Música", code: "MUS" }, as: :json
    expect(response).to have_http_status(:created)
    post "/api/courses", params: { group_id: group.id, teacher_id: teacher.id, subject_id: response.parsed_body["id"], weekly_periods: 2 }, as: :json
    expect(response).to have_http_status(:created)
    get "/api/courses"
    expect(response.parsed_body.first["subject_name"]).to eq("Música")
  end

  it "rejects an application with a visible explanation" do
    admission = create(:admission)
    post "/api/admissions/#{admission.id}/reject", params: { reason: "Información pendiente" }, as: :json
    expect(response).to have_http_status(:ok)
    expect(admission.reload.reason).to eq("Información pendiente")
  end

  it "approves through the API and exposes the enrollment" do
    admission = create(:admission)
    group = create(:group, academic_year: admission.academic_year)
    post "/api/admissions/#{admission.id}/approve", params: { group_id: group.id }, as: :json
    expect(response).to have_http_status(:created)
    get "/api/enrollments"
    expect(response.parsed_body.first["student_name"]).to eq(admission.student.full_name)
  end

  it "records attendance once when the teacher corrects it" do
    travel_to Time.zone.local(2026, 10, 20, 12) do
      enrollment = create(:enrollment)
      %w[absent justified].each do |status|
        post "/api/attendances", params: { enrollment_id: enrollment.id, on: Date.current, status: status }, as: :json
        expect(response).to have_http_status(:ok)
      end
      get "/api/attendances"
      expect(response.parsed_body.size).to eq(1)
      expect(response.parsed_body.first["status"]).to eq("justified")
    end
  end

  it "detects and displays three recent absences" do
    travel_to Time.zone.local(2026, 10, 20, 12) do
      enrollment = create(:enrollment)
      [ 14, 15, 16 ].each { |day| enrollment.attendances.create!(on: Date.new(2026, 10, day), status: "absent") }
      get "/api/dashboard"
      expect(response.parsed_body["alerts"].first["message"]).to include("3 inasistencias")
    end
  end

  it "creates, displays and deletes a school event" do
    year = create(:academic_year)
    post "/api/calendar_events", params: { academic_year_id: year.id, title: "Examen", kind: "exam", starts_at: "2026-11-10T09:00:00-06:00", ends_at: "2026-11-10T10:00:00-06:00" }, as: :json
    expect(response).to have_http_status(:created)
    id = response.parsed_body["id"]
    get "/api/calendar_events"
    expect(response.parsed_body.first["title"]).to eq("Examen")
    delete "/api/calendar_events/#{id}"
    expect(response).to have_http_status(:no_content)
  end

  it "filters announcements to the signed-in role" do
    Announcement.create!(title: "Docentes", body: "Privado para docentes", audience: "teacher")
    Announcement.create!(title: "Todos", body: "Público interno", audience: "all")
    guardian = create(:user)
    post "/api/session", params: { email: guardian.email, password: "School-test-password-26" }, as: :json
    get "/api/announcements"
    expect(response.parsed_body.pluck("title")).to eq([ "Todos" ])
  end

  it "generates a timetable through the API and deletes a session" do
    course = create(:course)
    post "/api/groups/#{course.group_id}/generate_schedule", as: :json
    expect(response).to have_http_status(:ok)
    get "/api/schedule_slots"
    expect(response.parsed_body.size).to eq(3)
    delete "/api/schedule_slots/#{response.parsed_body.first['id']}"
    expect(response).to have_http_status(:no_content)
  end

  it "rejects a manual conflicting session" do
    slot = create(:schedule_slot)
    post "/api/schedule_slots", params: { course_id: slot.course_id, weekday: 1, starts_minute: 500, ends_minute: 550, room: "Other" }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "requires CSRF tokens on writes" do
    previous = ActionController::Base.allow_forgery_protection
    ActionController::Base.allow_forgery_protection = true
    post "/api/subjects", params: { name: "Forged", code: "FORGED" }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(Subject.where(code: "FORGED")).not_to exist
  ensure
    ActionController::Base.allow_forgery_protection = previous
  end

  it "does not allow the administrator to deactivate their own account" do
    patch "/api/users/#{admin.id}", params: { active: false }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(admin.reload).to be_active
  end
end
