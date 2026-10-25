require "rails_helper"

RSpec.describe EmailTemplatePolicy do
  let(:template) { EmailTemplate.activity }

  it "allows an authorized administrator to list and edit institutional templates" do
    admin = create(:user, role: "admin")
    policy = described_class.new(admin, template)

    expect(policy.index?).to be(true)
    expect(policy.create?).to be(true)
    expect(policy.update?).to be(true)
    expect(described_class::Scope.new(admin, EmailTemplate).resolve).to eq(EmailTemplate.all)
  end

  it "denies families access to templates and resolves an empty scope" do
    guardian = create(:user, role: "guardian")
    template.save!
    policy = described_class.new(guardian, template)

    expect(policy.index?).to be(false)
    expect(policy.create?).to be(false)
    expect(policy.update?).to be(false)
    expect(described_class::Scope.new(guardian, EmailTemplate).resolve).to be_empty
  end

  it "does not allow inactive administrators to access templates" do
    admin = create(:user, role: "admin", active: false)

    expect(described_class.new(admin, template).index?).to be(false)
    expect(described_class::Scope.new(admin, EmailTemplate).resolve).to be_empty
  end
end
