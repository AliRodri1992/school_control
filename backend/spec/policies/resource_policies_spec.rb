require "rails_helper"

RSpec.describe "resource-based Pundit policies" do
  let(:guardian) { create(:user, role: "guardian") }
  let(:other) { create(:user, role: "guardian") }
  let!(:mine) { create(:student, guardian: guardian) }
  let!(:stranger) { create(:student, guardian: other) }

  it "keeps admission records scoped to the requesting family" do
    scope = AdmissionPolicy::Scope.new(guardian, Admission).resolve
    expect(scope.where(student: stranger)).to be_empty
    expect(AdmissionPolicy.new(guardian, Admission.new(student: mine)).create?).to be true
    expect(AdmissionPolicy.new(guardian, Admission.new(student: stranger)).create?).to be false
  end

  it "forbids a family from reviewing student documents and academic marks" do
    document = StudentDocument.new(student: mine, uploader: guardian, title: "Constancia")
    expect(StudentDocumentPolicy.new(guardian, document).create?).to be true
    expect(StudentDocumentPolicy.new(guardian, document).review?).to be false
    expect(StudentDocumentPolicy.new(guardian, StudentDocument.new(student: stranger)).download?).to be false
    expect(GradePolicy.new(guardian, Grade.new).publish?).to be false
  end

  it "filters grades and attendance records through the applicable scopes" do
    expect(GradePolicy::Scope.new(guardian, Grade).resolve.to_sql).to include("grades")
    expect(AttendancePolicy::Scope.new(guardian, Attendance).resolve.to_sql).to include("attendances")
    expect(AttendancePolicy.new(guardian, Attendance.new).create?).to be false
  end
end
