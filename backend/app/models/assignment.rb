class Assignment < ApplicationRecord
  belongs_to :course
  has_many :assignment_submissions, dependent: :restrict_with_error
  validates :title, presence: true, length: { maximum: 200 }
  validates :instructions, presence: true, length: { maximum: 10_000 }
  validates :due_at, presence: true
end
