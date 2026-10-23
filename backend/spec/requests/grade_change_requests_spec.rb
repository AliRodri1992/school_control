require "rails_helper"

RSpec.describe "Grade change requests", type: :request do
  let(:admin) { create(:user, role: "admin") }
  let(:enrollment) { create(:enrollment) }
  let(:course) { create(:course, group: enrollment.group) }
  let(:grade) do
    mark = Grade.create!(enrollment: enrollment, course: course, term: 1, score: 8, feedback: "Original")
    GradeWorkflow.review(grade: mark, actor: admin)
    GradeWorkflow.publish(grade: mark, actor: admin)
  end
  let(:endpoint) { "/api/grades/#{grade.id}/change_requests" }

  def login(user)
    post "/api/session", params: { email: user.email, password: "School-test-password-26" }, as: :json
    expect(response).to have_http_status(:ok)
  end

  def submit_change(actor = course.teacher, **overrides)
    login(actor)
    post endpoint, params: { score: 9, feedback: "Revisada", reason: "Error verificado", lock_version: grade.lock_version }.merge(overrides), as: :json
  end

  def resolve_change(request, decision = "approved", **overrides)
    post "#{endpoint}/#{request.id}/resolve", params: { decision: decision, resolution_reason: "Evidencia revisada" }.merge(overrides), as: :json
  end

  it "preserves the published mark until independent approval and records both authors" do
    grade
    notifications = enrollment.student.guardian.notifications.count
    submit_change
    expect(response).to have_http_status(:created)
    request = GradeChangeRequest.sole
    expect(grade.reload.score).to eq(8)
    expect(enrollment.student.guardian.notifications.count).to eq(notifications)
    expect(admin.notifications.last.params[:page]).to eq("grades")
    enrollment.update!(status: "completed", outcome: "promoted")
    login(admin)
    get endpoint
    expect(response.parsed_body.first.fetch("can_resolve")).to be(true)
    resolve_change(request)
    expect(response).to have_http_status(:ok)
    expect(request.reload.status).to eq("approved")
    expect(request.requester).to eq(course.teacher)
    expect(request.resolver).to eq(admin)
    expect(grade.reload.score).to eq(9)
    expect(grade.corrections.sole.actor).to eq(admin)
    expect(enrollment.reload.outcome).to eq("promoted")
    expect(enrollment.student.guardian.notifications.count).to eq(notifications + 1)
    expect { request.update!(reason: "Rewrite") }.to raise_error(ActiveRecord::ReadOnlyRecord)
  end

  it "rejects with a mandatory reason, preserves the mark and permits a new request" do
    submit_change
    request = GradeChangeRequest.sole
    login(admin)
    resolve_change(request, "rejected", resolution_reason: " ")
    expect(response).to have_http_status(:unprocessable_content)
    expect(request.reload.status).to eq("pending")
    resolve_change(request, "rejected")
    expect(response).to have_http_status(:ok)
    expect(grade.reload.score).to eq(8)
    expect(grade.corrections).to be_empty
    submit_change
    expect(response).to have_http_status(:created)
  end

  it "rejects self-approval and self-rejection even for administrators" do
    submit_change(admin)
    request = GradeChangeRequest.sole
    get endpoint
    expect(response.parsed_body.first.fetch("can_resolve")).to be(false)
    %w[approved rejected].each do |decision|
      resolve_change(request, decision)
      expect(response).to have_http_status(:unprocessable_content)
    end
    expect(request.reload.status).to eq("pending")
    expect(grade.reload.score).to eq(8)
  end

  it "denies family access and teachers outside their assigned course" do
    grade
    [ enrollment.student.guardian, create(:user, role: "student") ].each do |account|
      login(account)
      get endpoint
      expect(response).to have_http_status(:forbidden)
      post endpoint, params: { score: 9 }, as: :json
      expect(response).to have_http_status(:forbidden)
    end
    submit_change(create(:user, role: "teacher"))
    expect(response).to have_http_status(:not_found)
    expect(GradeChangeRequest.count).to eq(0)
  end

  it "denies teacher resolution and duplicate pending requests" do
    submit_change
    request = GradeChangeRequest.sole
    resolve_change(request)
    expect(response).to have_http_status(:forbidden)
    submit_change
    expect(response).to have_http_status(:unprocessable_content)
    expect(GradeChangeRequest.count).to eq(1)
    expect { GradeChangeRequest.transaction(requires_new: true) { request.dup.save! } }.to raise_error(ActiveRecord::RecordNotUnique)
  end

  it "does not let direct correction bypass a pending request" do
    submit_change
    login(admin)
    post "/api/grades/#{grade.id}/correct", params: { score: 10, reason: "Bypass", lock_version: grade.lock_version }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(grade.reload.score).to eq(8)
  end

  it "rejects stale approval but allows rejecting the outdated request" do
    submit_change
    request = GradeChangeRequest.sole
    grade.update_columns(lock_version: grade.lock_version + 1)
    login(admin)
    resolve_change(request)
    expect(response).to have_http_status(:unprocessable_content)
    expect(request.reload.status).to eq("pending")
    expect(grade.reload.score).to eq(8)
    resolve_change(request, "rejected")
    expect(response).to have_http_status(:ok)
  end

  it "prevents resolving twice" do
    submit_change
    request = GradeChangeRequest.sole
    login(admin)
    resolve_change(request)
    resolve_change(request)
    expect(response).to have_http_status(:unprocessable_content)
    expect(grade.corrections.count).to eq(1)
  end

  it "rolls back approval, history and mark when the resolution audit fails" do
    submit_change
    request = GradeChangeRequest.sole
    allow(AuditEvent).to receive(:create!).and_call_original
    allow(AuditEvent).to receive(:create!).with(hash_including(action: "grade_change.approved")).and_raise(ActiveRecord::RecordInvalid.new(AuditEvent.new))
    login(admin)
    resolve_change(request)
    expect(response).to have_http_status(:unprocessable_content)
    expect(request.reload.status).to eq("pending")
    expect(grade.reload.score).to eq(8)
    expect(grade.corrections).to be_empty
  end

  it "rejects invalid, unchanged and stale submissions without persisting" do
    [ { score: 11 }, { reason: " " }, { reason: "x" * 2001 }, { score: 8, feedback: "Original" }, { lock_version: -1 } ].each do |attributes|
      submit_change(**attributes)
      expect(response).to have_http_status(:unprocessable_content)
    end
    expect(GradeChangeRequest.count).to eq(0)
  end

  it "rejects drafts and forged requester or resolution fields" do
    grade.update_columns(status: "draft")
    submit_change
    expect(response).to have_http_status(:unprocessable_content)
    grade.update_columns(status: "published")
    submit_change(requester_id: admin.id, status: "approved", resolver_id: admin.id)
    expect(response).to have_http_status(:created)
    expect(GradeChangeRequest.sole.requester).to eq(course.teacher)
    expect(GradeChangeRequest.sole.status).to eq("pending")
  end
end
