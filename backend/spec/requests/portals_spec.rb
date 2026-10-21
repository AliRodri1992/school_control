require "rails_helper"

RSpec.describe "Portal access", type: :request do
  def login(user)
    post "/api/session", params: { email: user.email, password: "School-test-password-26" }, as: :json
    expect(response).to have_http_status(:ok)
  end

  it "requires authentication for student records" do
    get "/api/students"
    expect(response).to have_http_status(:unauthorized)
  end

  it "never exposes password hashes in a session response" do
    user = create(:user)
    login(user)
    expect(response.parsed_body.fetch("user")).not_to have_key("password_digest")
  end

  it "forces public registration to be a guardian account" do
    post "/api/registration", params: { name: "Family", email: "new@school.test", password: "School-test-password-26", role: "admin" }, as: :json
    expect(response).to have_http_status(:ok)
    expect(User.last.role).to eq("guardian")
  end

  it "does not permit guardians to list users or modify branding" do
    login(create(:user))
    get "/api/users"
    expect(response).to have_http_status(:forbidden)
    patch "/api/school", params: { name: "Other" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "isolates families and prevents a forged guardian assignment" do
    guardian = create(:user)
    own = create(:student, guardian: guardian)
    other = create(:student)
    login(guardian)
    get "/api/students"
    expect(response.parsed_body.pluck("id")).to eq([ own.id ])
    get "/api/students/#{other.id}/report"
    expect(response).to have_http_status(:not_found)
    post "/api/students", params: { first_name: "New", last_name: "Child", birth_date: "2020-01-01", curp: "DEMO200102HDFRNN01", guardian_id: other.guardian_id }, as: :json
    expect(response).to have_http_status(:created)
    expect(Student.last.guardian_id).to eq(guardian.id)
  end

  it "lets a learner see only their own record and prevents editing" do
    learner = create(:user, role: "student")
    own = create(:student, user: learner)
    create(:student)
    login(learner)
    get "/api/students"
    expect(response.parsed_body.pluck("id")).to eq([ own.id ])
    patch "/api/students/#{own.id}", params: { first_name: "Changed" }, as: :json
    expect(response).to have_http_status(:forbidden)
    post "/api/grades", params: {}, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "prevents teachers grading another teacher's class" do
    teacher = create(:user, role: "teacher")
    enrollment = create(:enrollment)
    other_course = create(:course, group: enrollment.group)
    login(teacher)
    post "/api/grades", params: { enrollment_id: enrollment.id, course_id: other_course.id, term: 1, score: 10 }, as: :json
    expect(response).to have_http_status(:not_found)
  end

  it "lets the assigned teacher save and correct a mark without duplicates" do
    enrollment = create(:enrollment)
    course = create(:course, group: enrollment.group)
    login(course.teacher)
    2.times do |i|
      post "/api/grades", params: { enrollment_id: enrollment.id, course_id: course.id, term: 1, score: 8 + i }, as: :json
      expect(response).to have_http_status(:ok)
    end
    expect(Grade.count).to eq(1)
    expect(Grade.last.score).to eq(9)
  end

  it "creates a student portal linked to the selected expediente" do
    admin = create(:user, role: "admin")
    student = create(:student)
    login(admin)
    post "/api/users", params: { name: student.full_name, email: "learner@school.test", role: "student", password: "School-test-password-26", student_id: student.id }, as: :json
    expect(response).to have_http_status(:created)
    expect(student.reload.user.role).to eq("student")
  end

  it "does not allow re-linking an existing learner account" do
    admin = create(:user, role: "admin")
    student = create(:student, user: create(:user, role: "student"))
    login(admin)
    expect do
      post "/api/users", params: { name: "Other", email: "other@school.test", role: "student", password: "School-test-password-26", student_id: student.id }, as: :json
    end.not_to change(User, :count)
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "revokes access when an account is deactivated" do
    user = create(:user)
    login(user)
    user.update!(active: false)
    get "/api/students"
    expect(response).to have_http_status(:unauthorized)
  end

  it "returns not found for a foreign admission approval attempt by a guardian" do
    admission = create(:admission)
    login(create(:user))
    post "/api/admissions/#{admission.id}/approve", params: { group_id: 1 }, as: :json
    expect(response).to have_http_status(:forbidden)
  end
end
