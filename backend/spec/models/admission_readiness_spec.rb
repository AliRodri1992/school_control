require "rails_helper"

RSpec.describe "Admission completeness" do
  it "checks whether required documents are available for the requested grade" do
    admission = create(:admission)
    student = admission.student
    expect(admission.missing_requirements).to include("Domicilio principal", "Teléfono de contacto", "Contacto familiar")
    student.addresses.create!(country_code: "MX", purpose: "home", line1: "Calle Escuela")
    student.phone_numbers.create!(number_e164: "+525555111122", purpose: "emergency")
    student.contacts.create!(name: "Tutor responsable", relationship: "Tutor")
    expect(admission.missing_requirements).to eq([])
    AdmissionDocumentRequirement.create!(academic_year: admission.academic_year,
      grade_level: admission.grade_level, title: "Acta de nacimiento")
    expect(admission.missing_requirements).to include("Documento: Acta de nacimiento")
    expect(admission.missing_requirements(for_formalization: true)).to include("Documento: Acta de nacimiento")
  end

  it "keeps draft applicants out of the enrollment count" do
    admission = create(:admission)
    admission.update!(status: "draft")
    expect(admission.student.enrollment_stage).to eq("applicant")
    expect(admission.complete_for_submission?).to eq(false)
  end
end
