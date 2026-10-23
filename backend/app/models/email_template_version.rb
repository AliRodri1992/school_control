class EmailTemplateVersion < ApplicationRecord
  belongs_to :email_template
  validates :revision, numericality: { greater_than: 0, only_integer: true }
  validates :revision, uniqueness: { scope: :email_template_id }
end
