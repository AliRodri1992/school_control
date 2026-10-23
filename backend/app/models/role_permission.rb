class RolePermission < ApplicationRecord
  belongs_to :access_role
  validates :key, inclusion: { in: ->(_) { PermissionCatalog.keys } }, uniqueness: { scope: :access_role_id }
  validate :valid_scope

  def valid_scope
    errors.add(:data_scope, "no es válido para esta acción") unless PermissionCatalog.scopes(key).include?(data_scope)
  end
end
