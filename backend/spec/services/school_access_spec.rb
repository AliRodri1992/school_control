require "rails_helper"

RSpec.describe SchoolAccess do
  it "uses active database grants for administrators, including after revocation" do
    admin = create(:user, role: "admin")
    role = admin.access_roles.first

    expect(described_class.new(admin, "subjects.create").scopes).to eq([ "institution" ])
    expect(admin.effective_permissions.fetch("subjects.create")).to eq([ "institution" ])

    role.role_permissions.find_by!(key: "subjects.create").destroy!

    expect(described_class.new(admin, "subjects.create").scopes).to be_empty
    expect(admin.effective_permissions).not_to have_key("subjects.create")
    expect(admin.can?("subjects.create")).to be(false)
    expect(admin.can?("subjects.index")).to be(true)
  end

  it "does not grant deleted report permissions through the administrator profile" do
    admin = create(:user, role: "admin")
    grant = admin.access_roles.first.role_permissions.find_by!(key: "report_enrollments.xlsx")

    expect(admin.can?("report_enrollments.xlsx")).to be(true)
    grant.destroy!

    expect(described_class.new(admin, "report_enrollments.xlsx").scopes).to be_empty
    expect(admin.can?("report_enrollments.xlsx")).to be(false)
    expect(admin.can?("report_enrollments.preview")).to be(true)
  end

  it "ignores grants from inactive roles and inactive accounts" do
    admin = create(:user, role: "admin")
    role = admin.access_roles.first

    role.update!(active: false)
    expect(described_class.new(admin, "subjects.create").scopes).to be_empty
    expect(admin.effective_permissions).to eq({})

    role.update!(active: true)
    admin.update!(active: false)
    expect(described_class.new(admin, "subjects.create").scopes).to be_empty
    expect(admin.effective_permissions).to eq({})
  end
end
