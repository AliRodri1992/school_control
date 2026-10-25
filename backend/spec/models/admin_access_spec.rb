require "rails_helper"

RSpec.describe "Acceso de administración" do
  let(:admin) { create(:user, role: "admin") }

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

  it "respeta permisos eliminados del rol administrador predeterminado" do
    role = admin.access_roles.first
    role.role_permissions.find_by!(key: "students.index").destroy!

    AccessRole.assign_default!(admin)

    expect(role.role_permissions.where(key: "students.index")).not_to exist
    expect(admin.can?("students.index")).to be(false)
    expect(admin.effective_permissions).not_to have_key("students.index")
  end

  it "no permite privilegios administrativos a un usuario todavía no guardado" do
    unpersisted_admin = User.new(role: "admin", active: true)

    expect(unpersisted_admin.effective_permissions).to eq({})
    expect(SchoolAccess.new(unpersisted_admin, "students.index").allows?).to be(false)
  end
end
