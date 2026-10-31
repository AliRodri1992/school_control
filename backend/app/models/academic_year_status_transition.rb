class AcademicYearStatusTransition < ApplicationRecord
  belongs_to :academic_year
  validates :from_status, :to_status, inclusion: { in: AcademicYear::STATUSES }
  validates :reason, :trigger, :occurred_at, presence: true

  def readonly? = persisted?
end
