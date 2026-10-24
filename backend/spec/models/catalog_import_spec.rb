require "rails_helper"
require "stringio"

RSpec.describe "catalog imports", type: :model do
  it "maps subjects and saves an idempotent ledger for every successful row" do
    admin = create(:user, role: "admin")
    batch = admin.data_imports.new(kind: "subjects")
    batch.file.attach(io: StringIO.new("Nombre,Clave\nHistoria,HIS-01\n"),
      filename: "materias.csv", content_type: "text/csv")
    batch.save!
    validator = ValidateCatalogImport.new(batch)
    mapping = validator.suggest(DataImportReader.new(batch).call[:headers])
    expect(validator.call(mapping)[:errors]).to eq([])
    batch.update!(mapping: mapping, status: "queued")
    DataImportJob.perform_now(batch.id)
    expect(batch.reload.imported_rows).to eq(1)
    expect(batch.data_import_items.count).to eq(1)
    expect(Subject.find_by(code: "HIS-01").name).to eq("Historia")
    DataImportJob.perform_now(batch.id)
    expect(Subject.where(code: "HIS-01").count).to eq(1)
  end

  it "rejects groups with references to unknown school years" do
    admin = create(:user, role: "admin")
    batch = admin.data_imports.new(kind: "groups")
    batch.file.attach(io: StringIO.new("Ciclo,Grado,Seccion,Cupo\nSin ciclo,1,A,25\n"),
      filename: "grupos.csv", content_type: "text/csv")
    batch.save!
    validator = ValidateCatalogImport.new(batch)
    mapping = validator.suggest(DataImportReader.new(batch).call[:headers])
    expect(validator.call(mapping)[:errors].first[:messages]).to include("Ciclo escolar no encontrado")
  end
end
