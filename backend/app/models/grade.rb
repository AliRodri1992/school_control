class Grade < ApplicationRecord
  belongs_to :enrollment
  belongs_to :course
  validates :term, inclusion: { in: 1..3 }, uniqueness: { scope: [ :enrollment_id, :course_id ] }
  validates :score, numericality: { in: 0..10 }
  validate :same_group

  def same_group
    return unless course && enrollment
    errors.add(:course, "no pertenece al grupo del alumno") unless course.group_id == enrollment.group_id
    errors.add(:base, "El ciclo del alumno está cerrado") unless enrollment.status == "active"
  end
end
