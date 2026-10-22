class Grade < ApplicationRecord
  belongs_to :enrollment
  belongs_to :course
  belongs_to :reviewer, class_name: "User", optional: true
  has_many :corrections, class_name: "GradeCorrection", dependent: :restrict_with_error
  attr_accessor :correction_authorized
  scope :published, -> { where(status: "published") }
  validates :status, inclusion: { in: %w[draft reviewed published] }
  validate :protect_published_mark

  validates :term, inclusion: { in: 1..3 }, uniqueness: { scope: [ :enrollment_id, :course_id ] }
  validates :score, numericality: { in: 0..10 }
  validate :same_group

  def protect_published_mark
    if persisted? && status_in_database == "published" && has_changes_to_save? && !correction_authorized
      errors.add(:base, "Una calificación publicada requiere una corrección administrativa con motivo")
    end
  end

  def same_group
    return unless course && enrollment
    errors.add(:course, "no pertenece al grupo del alumno") unless course.group_id == enrollment.group_id
    errors.add(:base, "El ciclo del alumno está cerrado") unless enrollment.status == "active" || correction_authorized
  end
end
