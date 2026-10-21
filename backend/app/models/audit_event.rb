class AuditEvent < ApplicationRecord
  belongs_to :user, optional: true
  validates :action, :record_type, :record_id, presence: true
end
