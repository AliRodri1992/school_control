class AccessRoleAssignment < ApplicationRecord
  belongs_to :user
  belongs_to :access_role
  validates :user_id, uniqueness: { scope: :access_role_id }
end
