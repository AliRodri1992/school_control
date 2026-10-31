require "rails_helper"
require_relative "../../db/demo_admissions"

RSpec.describe DemoAdmissions do
  it "creates each applicant scenario without duplicating records on repeated seeds" do
    # An actual school year starts after its previous historical year ends.
    year = create(:academic_year, starts_on: Date.new(2026, 8, 31),
      ends_on: Date.new(2027, 7, 9))
    guardian = create(:user)
    admin = create(:user, role: "admin")
    described_class.seed!(year: year, guardian: guardian, admin: admin)
    counts = [ Student.count, Admission.count, Enrollment.count, StudentDocument.count ]
    expect(Admission.where(academic_year: year).pluck(:status)).to include("draft", "submitted", "correction_requested", "approved", "rejected")
    described_class.seed!(year: year, guardian: guardian, admin: admin)
    expect([ Student.count, Admission.count, Enrollment.count, StudentDocument.count ]).to eq(counts)
    expect(Student.find_by!(first_name: "Diego", last_name: "Demostración").enrollment_stage).to eq("enrolled")
  end
end
