class Group < ApplicationRecord
  belongs_to :academic_year
  has_many :courses, dependent: :restrict_with_error
  has_many :enrollments, dependent: :restrict_with_error
  validates :grade_level, inclusion: { in: 1..6 }
  validates :section, inclusion: { in: %w[A B] }, uniqueness: { scope: [ :academic_year_id, :grade_level ] }
  validates :capacity, numericality: { only_integer: true, greater_than: 0 }
  validate :capacity_covers_enrollments
  validate :preserve_history
  validate :cycle_is_editable

  def cycle_is_editable
    errors.add(:base, "El ciclo escolar está cerrado") if academic_year&.closed_for_academics?
  end

  def preserve_history
    return unless persisted? && (academic_year_id_changed? || grade_level_changed? || section_changed?)
    errors.add(:base, "No se puede reasignar un grupo con clases o inscripciones") if courses.exists? || enrollments.exists?
  end

  def label = "#{grade_level}° #{section} · #{academic_year.name}"

  def capacity_covers_enrollments
    errors.add(:capacity, "es menor que la matrícula actual") if capacity && persisted? && capacity < enrollments.count
  end
end
