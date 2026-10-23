class Note < ApplicationRecord
  belongs_to :notable, polymorphic: true
  belongs_to :author, class_name: "User"
  validates :notable_type, inclusion: { in: %w[School Student User] }
  validates :body, presence: true, length: { maximum: 20_000 }
  validates :category, presence: true
  validates :visibility, inclusion: { in: %w[internal shared] }
end
