require "rails_helper"
require "stringio"

RSpec.describe "user imports", type: :model do
  def batch(role)
    admin = create(:user, role: "admin")
    item = admin.data_imports.new(kind: role)
    item.file.attach(io: StringIO.new("Nombre,Correo\nAlex Importado,alex-import@example.test\n"),
      filename: "personas.csv", content_type: "text/csv")
    item.save!
    item
  end

  it "creates teachers with private random credentials and a first-access email job" do
    item = batch("teachers")
    validator = ValidateUserImport.new(item)
    mapping = validator.suggest(DataImportReader.new(item).call[:headers])
    expect(validator.call(mapping)[:errors]).to eq([])
    item.update!(mapping: mapping, status: "queued")
    expect do
      DataImportJob.perform_now(item.id)
    end.to change(User.where(role: "teacher"), :count).by(1)
    expect(item.reload.row_errors).to be_empty
    account = User.find_by!(email: "alex-import@example.test")
    expect(account.authenticate("School-test-password-26")).to be_falsey
    expect(account.role).to eq("teacher")
    expect(AuditEvent.where(record_type: "User", record_id: account.id, action: "teacher.imported").count).to eq(1)
    expect(item.reload.imported_rows).to eq(1)
    DataImportJob.perform_now(item.id)
    expect(User.where(email: "alex-import@example.test").count).to eq(1)
  end

  it "requires distinct emails and never imports duplicate accounts" do
    item = batch("tutors")
    mapping = { "Nombre" => "name", "Correo" => "email" }
    expect(ValidateUserImport.new(item).call(mapping)[:errors]).to eq([])
    create(:user, email: "alex-import@example.test")
    expect(ValidateUserImport.new(item).call(mapping)[:errors]).not_to be_empty
  end
end
