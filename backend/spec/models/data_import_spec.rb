require "rails_helper"
require "stringio"

RSpec.describe "guided student imports", type: :model do
  it "suggests column mappings, validates family access and imports authorized students" do
    admin = create(:user, role: "admin")
    guardian = create(:user, role: "guardian")
    csv = "Nombre,Apellidos,CURP,Nacimiento,Correo Tutor\nAlex,Ejemplo,DEMO200101HDFRNN01,2020-01-01,#{guardian.email}\n"
    batch = admin.data_imports.new
    batch.file.attach(io: StringIO.new(csv), filename: "alumnos.csv", content_type: "text/csv")
    batch.save!
    reader = DataImportReader.new(batch).call
    validator = ValidateStudentImport.new(batch)
    expect(validator.suggest(reader[:headers]).values).to include("first_name", "last_name", "curp", "birth_date", "guardian_email")
    result = validator.call(validator.suggest(reader[:headers]))
    expect(result[:errors]).to eq([])
    batch.update!(mapping: validator.suggest(reader[:headers]), status: "queued")
    DataImportJob.perform_now(batch.id)
    expect(batch.reload.imported_rows).to eq(1)
    expect(Student.find_by(curp: "DEMO200101HDFRNN01").guardian).to eq(guardian)
  end

  it "rejects duplicated field mappings before importing" do
    validator = ValidateStudentImport.new(nil)
    expect { validator.validate_mapping!(%w[Nombre Apellidos], { "Nombre" => "first_name", "Apellidos" => "first_name" }) }.to raise_error(ArgumentError)
  end
end
