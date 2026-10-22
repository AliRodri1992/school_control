require "rails_helper"

RSpec.describe NotifySchoolActivity do
  it "notifies the document owner and actor without granting learners document access" do
    guardian = create(:user)
    learner = create(:user, role: "student")
    student = create(:student, guardian: guardian, user: learner)
    admin = create(:user, role: "admin")
    document = StudentDocument.new(student: student, uploader: guardian, title: "Acta")
    document.file.attach(io: StringIO.new("%PDF-1.4"), filename: "acta.pdf", content_type: "application/pdf")
    document.save!
    AuditEvent.create!(user: admin, action: "document.reviewed", record_type: "StudentDocument", record_id: document.id)
    expect(admin.notifications.count).to eq(1)
    expect(guardian.notifications.count).to eq(1)
    expect(learner.notifications.count).to eq(0)
  end

  it "rolls notices back with the transaction and does not notify for read receipts" do
    user = create(:user)
    AuditEvent.transaction do
      AuditEvent.create!(user: user, action: "user.updated", record_type: "User", record_id: user.id)
      raise ActiveRecord::Rollback
    end
    expect(user.notifications.count).to eq(0)
    AuditEvent.create!(user: user, action: "message.read", record_type: "InstitutionalMessage", record_id: 1)
    expect(user.notifications.count).to eq(0)
  end
end
