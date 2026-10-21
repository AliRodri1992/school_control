class AcademicYear < ApplicationRecord
  has_many :groups, dependent: :restrict_with_error
  has_many :admissions, dependent: :restrict_with_error
  validates :name, :starts_on, :ends_on, :admissions_open_on, :admissions_close_on,
            :reenrollment_open_on, :reenrollment_close_on, presence: true
  validates :name, uniqueness: true
  validate :ordered_dates

  def open_for?(kind)
    from, to = kind == "new" ? [ admissions_open_on, admissions_close_on ] : [ reenrollment_open_on, reenrollment_close_on ]
    from.present? && to.present? && Date.current.between?(from, to)
  end

  def ordered_dates
    [ [ starts_on, ends_on ], [ admissions_open_on, admissions_close_on ],
     [ reenrollment_open_on, reenrollment_close_on ] ].each do |from, to|
      errors.add(:base, "Las fechas de inicio deben preceder al cierre") if from && to && from > to
    end
    errors.add(:ends_on, "debe ser posterior al inicio") if starts_on && ends_on && starts_on == ends_on
  end
end
