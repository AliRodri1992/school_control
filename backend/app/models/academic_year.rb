class AcademicYear < ApplicationRecord
  has_many :admission_document_requirements, dependent: :restrict_with_error
  has_many :groups, dependent: :restrict_with_error
  has_many :admissions, dependent: :restrict_with_error
  validates :name, :starts_on, :ends_on, :admissions_open_on, :admissions_close_on,
            :reenrollment_open_on, :reenrollment_close_on, presence: true
  validates :name, uniqueness: true
  validate :ordered_dates
  validate :ordered_evaluation_periods

  EVALUATION_PERIODS = %w[first second third].freeze

  def evaluation_period(term)
    prefix = EVALUATION_PERIODS.fetch(Integer(term) - 1)
    { term: Integer(term), starts_on: public_send("#{prefix}_term_starts_on"), ends_on: public_send("#{prefix}_term_ends_on") }
  end

  def evaluation_periods
    (1..3).map { |term| evaluation_period(term) }
  end

  def ordered_evaluation_periods
    periods = EVALUATION_PERIODS.map { |prefix| [ public_send("#{prefix}_term_starts_on"), public_send("#{prefix}_term_ends_on") ] }
    periods.each_with_index do |(from, to), index|
      field = "#{EVALUATION_PERIODS[index]}_term_starts_on"
      errors.add(field, "debe configurarse junto con el cierre") if from.blank? != to.blank?
      next unless from && to
      errors.add(field, "debe estar dentro del ciclo escolar") if starts_on && ends_on && (from < starts_on || to > ends_on)
      errors.add("#{EVALUATION_PERIODS[index]}_term_ends_on", "debe ser igual o posterior al inicio") if from > to
      if index.positive? && periods[index - 1][1] && from <= periods[index - 1][1]
        errors.add(field, "debe comenzar después del trimestre anterior")
      end
    end
  end

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
