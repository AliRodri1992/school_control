class CalendarEvent < ApplicationRecord
  belongs_to :academic_year
  belongs_to :group, optional: true
  validates :title, :starts_at, :ends_at, presence: true
  validates :kind, inclusion: { in: %w[exam holiday meeting activity] }
  validate :consistent_dates

  def consistent_dates
    errors.add(:ends_at, "debe ser posterior al inicio") if starts_at && ends_at && ends_at <= starts_at
    errors.add(:group, "no pertenece al ciclo") if group && group.academic_year_id != academic_year_id
  end
end
