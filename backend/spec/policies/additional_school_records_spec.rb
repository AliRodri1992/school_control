require "rails_helper"

RSpec.describe "additional school record policies" do
  let(:guardian) { create(:user, role: "guardian") }
  let!(:own_student) { create(:student, guardian: guardian) }
  let!(:another_student) { create(:student) }

  it "requires family ownership to create or change emergency contacts" do
    own = StudentContact.new(student: own_student, name: "Abuelo", relationship: "Abuelo", phone: "5512345678")
    other = StudentContact.new(student: another_student, name: "Otro", relationship: "Familiar", phone: "5512345678")
    expect(StudentContactPolicy.new(guardian, own).create?).to be true
    expect(StudentContactPolicy.new(guardian, other).create?).to be false
    expect(StudentContactPolicy.new(guardian, other).destroy?).to be false
  end

  it "denies completion of enrollments to family members" do
    enrollment = create(:enrollment, student: own_student, admission: create(:admission, student: own_student))
    expect(EnrollmentPolicy.new(guardian, enrollment).complete?).to be false
  end
end
