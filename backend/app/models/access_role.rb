class AccessRole < ApplicationRecord
  has_many :role_permissions, dependent: :destroy
  has_many :access_role_assignments, dependent: :restrict_with_error
  has_many :users, through: :access_role_assignments
  validates :name, presence: true, uniqueness: true, length: { maximum: 100 }
  validates :description, length: { maximum: 2000 }

  def self.assign_default!(user)
    transaction do
      connection.execute("SELECT pg_advisory_xact_lock(730023)")
      role = find_by(default_profile: user.role)
      new_role = !role
      unless role
        role = create!(name: { "admin" => "Dirección", "teacher" => "Docente", "guardian" => "Familia", "student" => "Alumno" }.fetch(user.role), default_profile: user.role)
      end

      # Seed grants when a default role is first created. Never recreate
      # revoked permissions on an existing role during a login or seed run.
      if new_role
        PermissionCatalog.defaults(user.role).each do |key, scope|
          role.role_permissions.create!(key: key, data_scope: scope)
        end
      end

      AccessRoleAssignment.find_or_create_by!(user: user, access_role: role)
    end
  end
end
