require "rails_helper"

RSpec.describe StudentPolicy do
  let(:guardian) { create(:user, role: "guardian") }
  let(:other_guardian) { create(:user, role: "guardian") }
  let!(:own_student) { create(:student, guardian: guardian) }
  let!(:unrelated_student) { create(:student, guardian: other_guardian) }

  it "limits family scopes to their own children" do
    scope = described_class::Scope.new(guardian, Student).resolve
    expect(scope).to include(own_student)
    expect(scope).not_to include(unrelated_student)
  end

  it "authorizes the own student's details but not another family's data" do
    expect(described_class.new(guardian, own_student).show?).to be true
    expect(described_class.new(guardian, unrelated_student).show?).to be false
  end

  it "permits a school administrator to inspect both students" do
    admin = create(:user, role: "admin")
    expect(described_class::Scope.new(admin, Student).resolve).to include(own_student, unrelated_student)
  end
end
