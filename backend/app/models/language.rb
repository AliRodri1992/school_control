class Language < ApplicationRecord
  has_many :translation_entries, dependent: :restrict_with_error
  validates :code, presence: true, uniqueness: true, format: { with: /\A[a-z]{2}(?:-[A-Z]{2})?\z/ }
  validates :name, :native_name, presence: true
  validates :status, inclusion: { in: %w[draft active disabled] }
  validates :text_direction, inclusion: { in: %w[ltr rtl] }
  scope :active, -> { where(status: "active") }
end
