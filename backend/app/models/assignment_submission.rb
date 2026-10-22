class AssignmentSubmission < ApplicationRecord
  belongs_to :assignment
  belongs_to :enrollment
  belongs_to :reviewer, class_name: "User", optional: true
  validates :enrollment_id, uniqueness: { scope: :assignment_id }
  validates :body, presence: true, length: { maximum: 20_000 }
  validates :score, numericality: { in: 0..10 }, allow_nil: true
  validates :feedback, length: { maximum: 5000 }
  validate :same_group

  private

  def same_group
    return unless assignment && enrollment
    errors.add(:enrollment, "no pertenece al grupo de la tarea") unless enrollment.group_id == assignment.course.group_id
    errors.add(:enrollment, "debe estar activa") unless enrollment.status == "active"
  end
end
