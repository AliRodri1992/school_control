require "rails_helper"

RSpec.describe "Grade publication and corrections", type: :request do
  let(:admin) { create(:user, role: "admin") }
  let(:enrollment) { create(:enrollment) }
  let(:course) { create(:course, group: enrollment.group) }
  let(:grade) { Grade.create!(enrollment: enrollment, course: course, term: 1, score: 8, feedback: "Original") }

  def login(account)
    post "/api/session", params: { email: account.email, password: "School-test-password-26" }, as: :json
    expect(response).to have_http_status(:ok)
  end

  def publish(mark = grade)
    GradeWorkflow.review(grade: mark, actor: admin)
    GradeWorkflow.publish(grade: mark, actor: admin)
  end

  it "keeps drafts and reviewed grades out of family listings, reports and notifications" do
    guardian = enrollment.student.guardian
    login(course.teacher)
    post "/api/grades", params: { enrollment_id: enrollment.id, course_id: course.id, term: 1, score: 8, status: "published" }, as: :json
    expect(response.parsed_body.fetch("status")).to eq("draft")
    mark = Grade.last
    expect(guardian.notifications.count).to eq(0)
    GradeWorkflow.review(grade: mark, actor: admin)
    expect(guardian.notifications.count).to eq(0)
    login(guardian)
    get "/api/grades"
    expect(response.parsed_body).to eq([])
    get "/api/students/#{enrollment.student_id}/report"
    expect(response.parsed_body.fetch("years").first.fetch("grades")).to eq([])
    GradeWorkflow.publish(grade: mark, actor: admin)
    expect(guardian.notifications.count).to eq(1)
    get "/api/grades"
    expect(response.parsed_body.pluck("id")).to eq([ mark.id ])
    get "/api/students/#{enrollment.student_id}/report"
    expect(response.parsed_body.fetch("years").first.fetch("grades").pluck("id")).to eq([ mark.id ])
  end

  it "exposes only published marks to the linked student" do
    learner = create(:user, role: "student")
    enrollment.student.update!(user: learner)
    grade
    login(learner)
    get "/api/grades"
    expect(response.parsed_body).to eq([])
    publish
    get "/api/grades"
    expect(response.parsed_body.pluck("id")).to eq([ grade.id ])
  end

  it "requires an administrative review before publication and rejects stale transitions" do
    login(admin)
    post "/api/grades/#{grade.id}/publish", as: :json
    expect(response).to have_http_status(:unprocessable_content)
    post "/api/grades/#{grade.id}/review", as: :json
    expect(response).to have_http_status(:ok)
    expect(grade.reload.reviewer).to eq(admin)
    post "/api/grades/#{grade.id}/review", as: :json
    expect(response).to have_http_status(:unprocessable_content)
    post "/api/grades/#{grade.id}/publish", as: :json
    expect(response).to have_http_status(:ok)
    expect(grade.reload.published_at).to be_present
    expect(AuditEvent.where(action: "grade.published", record_id: grade.id).count).to eq(1)
  end

  it "prevents teachers and guardians from reviewing, publishing or correcting directly" do
    [ course.teacher, enrollment.student.guardian ].each do |account|
      login(account)
      %w[review publish correct].each do |action|
        post "/api/grades/#{grade.id}/#{action}", params: { lock_version: grade.lock_version, score: 10, reason: "Forged" }, as: :json
        expect(response).to have_http_status(:forbidden)
      end
    end
    expect(grade.reload.status).to eq("draft")
  end

  it "returns an edited reviewed mark to draft and clears its prior review" do
    GradeWorkflow.review(grade: grade, actor: admin)
    login(course.teacher)
    post "/api/grades", params: { enrollment_id: enrollment.id, course_id: course.id, term: 1, score: 9, status: "published" }, as: :json
    expect(response).to have_http_status(:ok)
    expect(grade.reload.attributes.slice("status", "reviewer_id", "reviewed_at")).to eq("status" => "draft", "reviewer_id" => nil, "reviewed_at" => nil)
    expect(grade.score).to eq(9)
  end

  it "prevents overwriting a published mark through ordinary capture or the model" do
    publish
    login(admin)
    post "/api/grades", params: { enrollment_id: enrollment.id, course_id: course.id, term: 1, score: 10 }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect { grade.update!(score: 10) }.to raise_error(ActiveRecord::RecordInvalid)
    expect(grade.reload.score).to eq(8)
  end

  it "records justified corrections after closure without silently changing promotion" do
    publish
    enrollment.update!(status: "completed", outcome: "promoted")
    login(admin)
    post "/api/grades/#{grade.id}/correct", params: { lock_version: grade.lock_version, score: 9, feedback: "Corregida", reason: "Error de captura verificado" }, as: :json
    expect(response).to have_http_status(:ok)
    correction = grade.corrections.sole
    expect(correction.attributes.slice("previous_score", "score", "previous_feedback", "feedback")).to eq("previous_score" => 8, "score" => 9, "previous_feedback" => "Original", "feedback" => "Corregida")
    expect(correction.actor).to eq(admin)
    expect(grade.reload.status).to eq("published")
    expect(enrollment.reload.outcome).to eq("promoted")
    expect { correction.update!(reason: "Replace history") }.to raise_error(ActiveRecord::ReadOnlyRecord)
    get "/api/grades/#{grade.id}/history"
    expect(response.parsed_body.first.fetch("reason")).to eq("Error de captura verificado")
  end

  [ nil, "", " ", "x" * 2001 ].each do |invalid_reason|
    it "rejects invalid correction reason #{invalid_reason.inspect} without side effects" do
      publish
      login(admin)
      original_version = grade.lock_version
      notifications = enrollment.student.guardian.notifications.count
      attributes = { lock_version: original_version, score: 9 }
      attributes[:reason] = invalid_reason unless invalid_reason.nil?
      post "/api/grades/#{grade.id}/correct", params: attributes, as: :json
      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body.fetch("errors")).to have_key("reason")
      expect(grade.reload.score).to eq(8)
      expect(grade.lock_version).to eq(original_version)
      expect(grade.corrections.count).to eq(0)
      expect(AuditEvent.where(action: "grade.corrected", record_id: grade.id)).not_to exist
      expect(enrollment.student.guardian.notifications.count).to eq(notifications)
    end
  end

  it "rolls back an out-of-range correction" do
    publish
    login(admin)
    post "/api/grades/#{grade.id}/correct", params: { lock_version: grade.lock_version, score: 11, reason: "Invalid score" }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(grade.reload.score).to eq(8)
    expect(grade.corrections.count).to eq(0)
  end

  it "rolls the correction and mark back if audit persistence fails" do
    publish
    login(admin)
    allow(AuditEvent).to receive(:create!).and_raise(ActiveRecord::RecordInvalid.new(AuditEvent.new))
    post "/api/grades/#{grade.id}/correct", params: { lock_version: grade.lock_version, score: 9, reason: "Verified" }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(grade.reload.score).to eq(8)
    expect(grade.corrections.count).to eq(0)
  end

  it "rejects a correction from an outdated screen without overwriting the latest mark" do
    publish
    version = grade.lock_version
    login(admin)
    post "/api/grades/#{grade.id}/correct", params: { lock_version: version, score: 9, reason: "First correction" }, as: :json
    expect(response).to have_http_status(:ok)
    post "/api/grades/#{grade.id}/correct", params: { lock_version: version, score: 7, reason: "Stale correction" }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(grade.reload.score).to eq(9)
    expect(grade.corrections.count).to eq(1)
  end

  it "limits teacher reports and correction history to their own subjects" do
    grade
    other_course = create(:course, group: enrollment.group)
    other = Grade.create!(enrollment: enrollment, course: other_course, term: 1, score: 5)
    login(course.teacher)
    get "/api/students/#{enrollment.student_id}/report"
    expect(response.parsed_body.fetch("years").first.fetch("grades").pluck("id")).to eq([ grade.id ])
    get "/api/grades/#{other.id}/history"
    expect(response).to have_http_status(:not_found)
    login(enrollment.student.guardian)
    get "/api/grades/#{grade.id}/history"
    expect(response).to have_http_status(:forbidden)
  end

  it "requires publication of all three terms before closing an enrollment" do
    grade
    [ 2, 3 ].each { |term| Grade.create!(enrollment: enrollment, course: course, term: term, score: 8) }
    expect { CompleteEnrollment.call(enrollment: enrollment, outcome: "promoted", actor: admin) }.to raise_error(ArgumentError, /publicadas/)
    enrollment.grades.each { |mark| publish(mark) }
    expect { CompleteEnrollment.call(enrollment: enrollment, outcome: "promoted", actor: admin) }
      .to raise_error(ArgumentError, /evaluaciones oficiales/)
    FormativeEvaluation::FIELDS.each_key do |field|
      (1..3).each do |term|
        FormativeEvaluation.create!(enrollment: enrollment, field_code: field, term: term,
          score: 8, status: "published", published_at: Time.current)
      end
    end
    CompleteEnrollment.call(enrollment: enrollment, outcome: "promoted", actor: admin)
    expect(enrollment.reload.status).to eq("completed")
  end
end
