require "rails_helper"

RSpec.describe "Classroom", type: :request do
  let(:learner) { create(:user, role: "student") }
  let(:student) { create(:student, user: learner) }
  let(:enrollment) { create(:enrollment, student: student, admission: create(:admission, student: student)) }
  let(:course) { create(:course, group: enrollment.group) }
  let(:assignment) { Assignment.create!(course: course, title: "Lectura", instructions: "Describe lo que aprendiste", due_at: 1.day.ago, published: true) }

  def login(account)
    post "/api/session", params: { email: account.email, password: "School-test-password-26" }, as: :json
  end

  it "restricts task creation to the assigned teacher" do
    login(create(:user, role: "teacher"))
    post "/api/assignments", params: { course_id: course.id, title: "Test", instructions: "Test", due_at: Time.current }, as: :json
    expect(response).to have_http_status(:not_found)
    login(course.teacher)
    post "/api/assignments", params: { course_id: course.id, title: "Test", instructions: "Test", due_at: Time.current }, as: :json
    expect(response).to have_http_status(:created)
    login(learner)
    get "/api/assignments"
    expect(response.parsed_body).to eq([])
  end

  it "accepts a late submission, validates review and protects reviewed work" do
    assignment
    login(learner)
    post "/api/assignments/#{assignment.id}/submit", params: { enrollment_id: enrollment.id, body: "Mi respuesta", score: 10 }, as: :json
    expect(response).to have_http_status(:ok)
    submission = AssignmentSubmission.last
    expect(submission.score).to be_nil
    expect(response.parsed_body["late"]).to be(true)
    post "/api/assignments/#{assignment.id}/review", params: { submission_id: submission.id, score: 10, lock_version: 0 }, as: :json
    expect(response).to have_http_status(:forbidden)
    login(course.teacher)
    post "/api/assignments/#{assignment.id}/review", params: { submission_id: submission.id, score: 8, feedback: "Buen trabajo", lock_version: 0 }, as: :json
    expect(response).to have_http_status(:ok)
    expect(submission.reload.score).to eq(8)
    login(learner)
    post "/api/assignments/#{assignment.id}/submit", params: { enrollment_id: enrollment.id, body: "Cambio", lock_version: 1 }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(submission.reload.body).to eq("Mi respuesta")
    expect(Grade.count).to eq(0)
  end

  it "isolates submissions between learners and classes" do
    assignment
    login(create(:user, role: "student"))
    get "/api/assignments/#{assignment.id}/submissions"
    expect(response).to have_http_status(:not_found)
    post "/api/assignments/#{assignment.id}/submit", params: { enrollment_id: enrollment.id, body: "Injected" }, as: :json
    expect(response).to have_http_status(:not_found)
    login(student.guardian)
    post "/api/assignments/#{assignment.id}/submit", params: { enrollment_id: enrollment.id, body: "Injected" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end
end
