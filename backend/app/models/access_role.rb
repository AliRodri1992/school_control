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

      # The built-in administrator role must receive permissions added after
      # the role was originally created, without changing custom roles.
      if user.admin?
        PermissionCatalog.defaults("admin").each do |key, scope|
          grant = role.role_permissions.find_or_initialize_by(key: key)
          grant.data_scope = scope
          grant.save! if grant.new_record? || grant.changed?
        end
      elsif new_role
        PermissionCatalog.defaults(user.role).each { |key, scope| role.role_permissions.create!(key: key, data_scope: scope) }
      end

      AccessRoleAssignment.find_or_create_by!(user: user, access_role: role)
    end
  end
end
