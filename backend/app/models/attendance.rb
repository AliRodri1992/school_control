class Attendance < ApplicationRecord
  belongs_to :enrollment
  validates :on, presence: true, uniqueness: { scope: :enrollment_id }
  validates :status, inclusion: { in: %w[present absent late justified] }
  validate :school_day

  def school_day
    return unless on && enrollment
    year = enrollment.academic_year
    errors.add(:on, "debe ser un día hábil del ciclo, no futuro") unless on.between?(year.starts_on, [ year.ends_on, Date.current ].min) && (1..5).cover?(on.wday)
    errors.add(:base, "El ciclo del alumno está cerrado") if enrollment.status != "active" || year.closed_for_academics?
  end
end
