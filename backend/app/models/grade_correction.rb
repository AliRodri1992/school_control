class GradeCorrection < ApplicationRecord
  belongs_to :grade
  belongs_to :actor, class_name: "User"
  validates :reason, presence: true, length: { maximum: 2000 }
  validates :score, :previous_score, numericality: { in: 0..10 }

  def readonly?
    persisted?
  end
end
