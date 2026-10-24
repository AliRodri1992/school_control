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
  it "incluye a alumnos existentes en el alcance del administrador" do
    guardian = User.create!(name: "Tutora de prueba", email: "tutora.scope@example.test",
      role: "guardian", password: "TestPassword123!")
    student = Student.create!(first_name: "Alex", last_name: "Ejemplo",
      curp: "DEMO200101HDFRNN01", birth_date: Date.new(2020, 1, 1), guardian: guardian)

    expect(StudentPolicy::Scope.new(admin, Student).resolve).to include(student)
  end

  it "reconstruye permisos faltantes del rol administrador predeterminado" do
    persisted_admin = User.create!(name: "Administrador de prueba",
      email: "administrador.scope@example.test", role: "admin", password: "TestPassword123!")
    role = AccessRole.find_by!(default_profile: "admin")
    role.role_permissions.where(key: "students.index").delete_all

    AccessRole.assign_default!(persisted_admin)

    expect(role.role_permissions.find_by!(key: "students.index").data_scope).to eq("institution")
  end

end
