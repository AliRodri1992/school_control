require "rails_helper"

RSpec.describe "Authorized dashboard analytics", type: :request do
  def login(account)
    post "/api/session", params: { email: account.email, password: "School-test-password-26" }, as: :json
    expect(response).to have_http_status(:ok)
  end

  def published_grade(enrollment, course, term:, score:)
    Grade.create!(enrollment: enrollment, course: course, term: term, score: score, status: "published")
  end

  it "builds real administrator trends, admission statuses and grade distribution" do
    enrollment = create(:enrollment)
    course = create(:course, group: enrollment.group)
    published_grade(enrollment, course, term: 1, score: 8.5)
    Admission.where(id: enrollment.admission.id).update_all(status: "approved")
    login(create(:user, role: "admin"))

    get "/api/dashboard", as: :json
    expect(response).to have_http_status(:ok)
    data = response.parsed_body
    expect(data.fetch("enrollment_trend")).to include(hash_including("value" => 1))
    expect(data.fetch("students_by_grade")).to include("label" => "1°", "value" => 1)
    expect(data.fetch("admission_status")).to include("label" => "Aprobadas", "value" => 1)
    expect(data.fetch("grade_distribution")).to include("label" => "8", "value" => 1)
    expect(data.fetch("grades_by_term")).to include("label" => "Periodo 1", "value" => 8.5)
  end

  it "limits teachers to their assigned classes, including published mark averages" do
    enrollment = create(:enrollment)
    course = create(:course, group: enrollment.group)
    published_grade(enrollment, course, term: 1, score: 9)
    other_enrollment = create(:enrollment)
    other_course = create(:course, group: other_enrollment.group)
    published_grade(other_enrollment, other_course, term: 1, score: 3)
    login(course.teacher)

    get "/api/dashboard", as: :json
    expect(response).to have_http_status(:ok)
    data = response.parsed_body
    expect(data.fetch("grades_by_term")).to eq([ { "label" => "Periodo 1", "value" => 9.0 } ])
    expect(data.fetch("grades_by_subject")).to include("label" => course.subject.name, "value" => 9.0)
    expect(data.fetch("enrollment_trend")).to include(hash_including("value" => 1))
  end

  it "scopes family charts to the selected child and excludes unpublished scores" do
    enrollment = create(:enrollment)
    guardian = enrollment.student.guardian
    course = create(:course, group: enrollment.group)
    published_grade(enrollment, course, term: 1, score: 8)
    Grade.create!(enrollment: enrollment, course: course, term: 2, score: 2, status: "draft")
    second = create(:student, guardian: guardian)
    other_enrollment = create(:enrollment, admission: create(:admission, student: second))
    other_course = create(:course, group: other_enrollment.group)
    published_grade(other_enrollment, other_course, term: 1, score: 4)
    outsider = create(:enrollment)
    login(guardian)

    get "/api/dashboard", params: { student_id: enrollment.student.id }, as: :json
    expect(response).to have_http_status(:ok)
    data = response.parsed_body
    expect(data.fetch("chart_filters").fetch("student_id")).to eq(enrollment.student.id)
    expect(data.fetch("available_years")).to include("id" => enrollment.academic_year_id, "name" => enrollment.academic_year.name)
    expect(data.fetch("grades_by_term")).to eq([ { "label" => "Periodo 1", "value" => 8.0 } ])
    expect(data.fetch("students")).to eq(1)
    get "/api/dashboard", params: { student_id: second.id }, as: :json
    expect(response.parsed_body.fetch("grades_by_term")).to eq([ { "label" => "Periodo 1", "value" => 4.0 } ])
    get "/api/dashboard", params: { student_id: outsider.student_id }, as: :json
    expect(response).to have_http_status(:not_found)
  end

  it "calculates attendance denominators, monthly absences and family assignment submissions" do
    enrollment = create(:enrollment)
    course = create(:course, group: enrollment.group)
    date = Date.current.prev_occurring(:friday)
    Attendance.create!(enrollment: enrollment, on: date, status: "late")
    Attendance.create!(enrollment: enrollment, on: date - 1.day, status: "absent")
    first = Assignment.create!(course: course, title: "Tarea 1", instructions: "Contestar", due_at: 3.days.ago, published: true)
    Assignment.create!(course: course, title: "Tarea 2", instructions: "Resolver", due_at: 2.days.ago, published: true)
    AssignmentSubmission.create!(assignment: first, enrollment: enrollment, body: "Listo", submitted_at: 1.day.ago)
    login(enrollment.student.guardian)

    get "/api/dashboard", params: { student_id: enrollment.student.id,
                                    from: (Date.current - 30.days).iso8601, to: Date.current.iso8601 }, as: :json
    expect(response).to have_http_status(:ok)
    data = response.parsed_body
    expect(data.fetch("attendance_rate")).to eq([
      { "label" => "Asistencias", "value" => 1 }, { "label" => "Faltas", "value" => 1 }
    ])
    expect(data.fetch("monthly_absences")).to include(hash_including("absent" => 1, "late" => 1))
    expect(data.fetch("assignment_progress")).to eq([
      { "label" => "Entregadas", "value" => 1 }, { "label" => "Pendientes", "value" => 1 }
    ])
    expect(data.fetch("attendance_trend")).to include(hash_including("value" => 50.0))
  end

  it "rejects invalid future dates, reversed ranges and unauthorized group filters" do
    guardian = create(:user, role: "guardian")
    login(guardian)
    get "/api/dashboard", params: { from: "2026-99-99" }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    get "/api/dashboard", params: { from: Date.current.iso8601, to: (Date.current - 2.days).iso8601 }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    get "/api/dashboard", params: { to: (Date.current + 1.day).iso8601 }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    get "/api/dashboard", params: { group_id: create(:group).id }, as: :json
    expect(response).to have_http_status(:not_found)
  end

  it "redacts grade analytics immediately after the grade index permission is revoked" do
    enrollment = create(:enrollment)
    course = create(:course, group: enrollment.group)
    published_grade(enrollment, course, term: 1, score: 7)
    login(course.teacher)
    get "/api/dashboard", as: :json
    expect(response.parsed_body.fetch("grades_by_term")).not_to be_empty

    course.teacher.access_roles.first.role_permissions.find_by!(key: "grades.index").destroy!
    get "/api/dashboard", as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("grades_by_term")).to eq([])
    expect(response.parsed_body.fetch("grades_by_subject")).to eq([])
  end
end
