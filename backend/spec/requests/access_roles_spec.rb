require "rails_helper"

RSpec.describe "Configurable roles and permissions", type: :request do
  let(:admin) { create(:user, role: "admin") }

  def login(user)
    post "/api/session", params: { email: user.email, password: "School-test-password-26" }, as: :json
    expect(response).to have_http_status(:ok)
  end

  def grants(values)
    values.map { |key, scope| { key: key, data_scope: scope } }
  end

  def role_with(name, values)
    role = AccessRole.create!(name: name)
    grants(values).each { |grant| role.role_permissions.create!(grant) }
    role
  end

  it "migrates defaults without duplication and exposes effective permissions" do
    login(admin)
    expect(response.parsed_body.dig("user", "permissions", "grades.publish")).to eq([ "institution" ])
    expect { AccessRole.assign_default!(admin) }.not_to change(AccessRoleAssignment, :count)
    get "/api/access_roles"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("catalog")).to include(hash_including("key" => "grades.create"))
  end

  it "revokes an action on the next request, even for an admin profile" do
    login(admin)
    admin.access_roles.first.role_permissions.find_by!(key: "subjects.create").destroy!
    post "/api/subjects", params: { name: "Forged", code: "NO" }, as: :json
    expect(response).to have_http_status(:forbidden)
    expect(Subject.count).to eq(0)
    get "/api/subjects"
    expect(response).to have_http_status(:ok)
  end

  it "allows a delegated non-admin to perform an explicitly granted action" do
    admin
    coordinator = create(:user, role: "teacher")
    role = role_with("Coordinación", "subjects.index" => "institution", "subjects.create" => "institution")
    coordinator.access_roles << role
    login(coordinator)
    post "/api/subjects", params: { name: "Música", code: "MUS" }, as: :json
    expect(response).to have_http_status(:created)
    get "/api/users"
    expect(response).to have_http_status(:forbidden)
  end

  it "keeps teaching write scope separate from family read scope" do
    teacher = create(:user, role: "teacher")
    own = create(:enrollment)
    other_course = create(:course, group: own.group)
    mark = Grade.create!(course: other_course, enrollment: own, term: 1, score: 8)
    family = role_with("Tutor adicional", "grades.index" => "family", "students.index" => "family")
    teacher.access_roles << family
    own.student.update!(guardian: teacher)
    login(teacher)
    get "/api/grades"
    expect(response.parsed_body).to eq([])
    post "/api/grades", params: { course_id: other_course.id, enrollment_id: own.id, term: 1, score: 10 }, as: :json
    expect(response).to have_http_status(:not_found)
    GradeWorkflow.review(grade: mark, actor: admin)
    GradeWorkflow.publish(grade: mark, actor: admin)
    get "/api/grades"
    expect(response.parsed_body.pluck("id")).to eq([ mark.id ])
  end

  it "saves a complete permission set and rejects stale updates" do
    login(admin)
    post "/api/access_roles", params: { name: "Consulta", permissions: grants("students.index" => "assigned") }, as: :json
    expect(response).to have_http_status(:created)
    role = AccessRole.find(response.parsed_body.fetch("id"))
    version = role.lock_version
    patch "/api/access_roles/#{role.id}", params: { name: "Consulta actualizada", lock_version: version, permissions: grants("students.index" => "family") }, as: :json
    expect(response).to have_http_status(:ok)
    patch "/api/access_roles/#{role.id}", params: { lock_version: version, permissions: [] }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(role.role_permissions.reload.pluck(:data_scope)).to eq([ "family" ])
  end

  it "rejects unknown keys, unsafe scopes and missing dependencies atomically" do
    login(admin)
    [ { "unknown.create" => "institution" }, { "grades.create" => "family" }, { "grades.create" => "assigned" } ].each do |values|
      post "/api/access_roles", params: { name: "Invalid", permissions: grants(values) }, as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end
    expect(AccessRole.where(name: "Invalid")).not_to exist
  end

  it "does not let a delegated role manager grant powers they do not hold" do
    admin
    teacher = create(:user, role: "teacher")
    role = role_with("Delegado", "access_roles.index" => "institution", "access_roles.create" => "institution")
    teacher.access_roles << role
    login(teacher)
    post "/api/access_roles", params: { name: "Escalation", permissions: grants("users.index" => "institution") }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(AccessRole.where(name: "Escalation")).not_to exist
  end

  it "prevents removing the last permission manager through assignments or role deactivation" do
    login(admin)
    post "/api/access_roles/assign", params: { user_id: admin.id, access_role_ids: [] }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(admin.reload.can?("access_roles.assign")).to be(true)
    role = admin.access_roles.first
    patch "/api/access_roles/#{role.id}", params: { active: false, lock_version: role.lock_version, permissions: grants(admin.effective_permissions.transform_values(&:first)) }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(role.reload.active).to be(true)
  end

  it "replaces roles with audit and revokes access without a new login" do
    recipient = create(:user, role: "teacher")
    login(admin)
    post "/api/access_roles/assign", params: { user_id: recipient.id, access_role_ids: [] }, as: :json
    expect(response).to have_http_status(:ok)
    expect(AuditEvent.where(action: "access_role.assigned", record_id: recipient.id)).to exist
    login(recipient)
    get "/api/grades"
    expect(response).to have_http_status(:forbidden)
  end

  it "denies families role management and ignores forged grants on registration" do
    login(create(:user))
    get "/api/access_roles"
    expect(response).to have_http_status(:forbidden)
    post "/api/registration", params: { name: "Family", email: "new@school.test", password: "School-test-password-26", role: "admin", access_role_ids: [ admin.access_roles.first.id ] }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("user", "permissions")).not_to have_key("access_roles.update")
  end
end
