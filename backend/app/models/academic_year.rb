class AcademicYear < ApplicationRecord
  EVALUATION_PERIODS = %w[first second third].freeze
  STATUSES = %w[draft active closing closed archived].freeze
  SOURCES = %w[manual sep state school].freeze

  attr_accessor :lifecycle_transition_authorized

  has_many :status_transitions, class_name: "AcademicYearStatusTransition", dependent: :restrict_with_error
  has_many :admission_document_requirements, dependent: :restrict_with_error
  has_many :groups, dependent: :restrict_with_error
  has_many :admissions, dependent: :restrict_with_error
  has_many :enrollments, dependent: :restrict_with_error
  has_many :calendar_events, dependent: :restrict_with_error

  validates :name, :starts_on, :ends_on, :admissions_open_on, :admissions_close_on,
            :reenrollment_open_on, :reenrollment_close_on, presence: true
  validates :name, uniqueness: true
  validates :status, inclusion: { in: STATUSES }
  validates :calendar_source, inclusion: { in: SOURCES }
  validates :planned_school_days, numericality: { only_integer: true, in: 1..366 }, allow_nil: true
  validates :notes, length: { maximum: 4000 }
  validates :calendar_source_reference, length: { maximum: 255 }
  validate :valid_source_url
  validate :ordered_dates
  validate :ordered_evaluation_periods
  validate :ordered_capture_windows
  validate :ordered_lifecycle_dates
  validate :protect_lifecycle_status, on: :update
  validate :protect_academic_dates, on: :update

  def closed_for_academics? = %w[closed archived].include?(status)

  def administrative_close_date = administrative_closes_on || ends_on + 30.days
  def archive_date = archive_on || ends_on + 5.years

  def ordered_lifecycle_dates
    if administrative_closes_on && ends_on && administrative_closes_on < ends_on
      errors.add(:administrative_closes_on, "no puede ser anterior al fin de clases")
    end
    if archive_on && archive_on < (administrative_closes_on || ends_on)
      errors.add(:archive_on, "no puede ser anterior al cierre administrativo")
    end
  end

  def protect_lifecycle_status
    if will_save_change_to_status? && !lifecycle_transition_authorized
      errors.add(:status, "solo puede cambiar mediante la automatización del ciclo escolar")
    end
  end

  def protect_academic_dates
    return unless (enrollments.exists? || admissions.exists?)
    watched = %w[starts_on ends_on first_term_starts_on first_term_ends_on second_term_starts_on
                 second_term_ends_on third_term_starts_on third_term_ends_on]
    # Filling a previously unknown trimester is safe for historical/demo import.
    # Changing an already established date with linked records requires a
    # separate administrative rectification, never a regular edit form.
    if watched.any? { |attribute| will_save_change_to_attribute?(attribute) &&
      attribute_change_to_be_saved(attribute)&.first.present? }
      errors.add(:base, "Hay expedientes vinculados; las fechas académicas requieren una rectificación autorizada")
    end
  end

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

  def ordered_capture_windows
    EVALUATION_PERIODS.each do |prefix|
      from = public_send("#{prefix}_term_capture_opens_on")
      to = public_send("#{prefix}_term_capture_closes_on")
      errors.add("#{prefix}_term_capture_closes_on", "debe ser igual o posterior a la apertura") if from && to && from > to
      [ "capture_opens_on", "capture_closes_on", "review_on", "reports_on" ].each do |suffix|
        field = "#{prefix}_term_#{suffix}"
        date = public_send(field)
        next unless date && starts_on && ends_on
        errors.add(field, "debe estar dentro del calendario escolar") unless date.between?(starts_on, ends_on + 30.days)
      end
      review = public_send("#{prefix}_term_review_on")
      reports = public_send("#{prefix}_term_reports_on")
      errors.add("#{prefix}_term_review_on", "debe ser posterior al cierre de captura") if review && to && review < to
      errors.add("#{prefix}_term_reports_on", "no puede ser anterior a la revisión") if reports && review && reports < review
    end
  end

  def valid_source_url
    return if calendar_source_url.blank?
    uri = URI.parse(calendar_source_url)
    errors.add(:calendar_source_url, "debe ser una URL http o https") unless %w[http https].include?(uri.scheme) && uri.host.present?
  rescue URI::InvalidURIError
    errors.add(:calendar_source_url, "debe ser una URL válida")
  end

  def open_for?(kind)
    return false if %w[closed archived].include?(status)
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
