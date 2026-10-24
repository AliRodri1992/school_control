require "rails_helper"

RSpec.describe "Acceso de administración" do
  let(:admin) { User.new(role: "admin", active: true) }

  it "expone todos los permisos efectivos del catálogo para un administrador activo" do
    expect(admin.effective_permissions.keys).to match_array(PermissionCatalog.keys)
    expect(admin.effective_permissions.fetch("students.index")).to include("institution")
    expect(admin.can?("students.index")).to be(true)
  end

  it "permite consultar el alcance institucional de los alumnos" do
    access = SchoolAccess.new(admin, "students.index")
    expect(access.institution?).to be(true)
    expect(access.students.to_sql).to eq(Student.all.to_sql)
  end

  it "no concede permisos de administrador a cuentas inactivas" do
    admin.active = false
    expect(SchoolAccess.new(admin, "students.index").allows?).to be(false)
  end
end
