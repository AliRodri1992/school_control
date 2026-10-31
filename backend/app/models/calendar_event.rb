class CalendarEvent < ApplicationRecord
  KINDS = %w[exam holiday meeting activity suspension vacation cte evaluation report_delivery administrative].freeze
  SOURCES = %w[manual sep state school].freeze

  belongs_to :academic_year
  belongs_to :group, optional: true
  validates :title, :starts_at, :ends_at, presence: true
  validates :title, length: { maximum: 200 }
  validates :kind, inclusion: { in: KINDS }
  validates :source_type, inclusion: { in: SOURCES }
  validates :external_uid, uniqueness: { scope: :academic_year_id }, allow_nil: true
  validate :consistent_dates
  validate :cycle_is_editable
  validate :valid_source_url

  def cycle_is_editable
    if academic_year && academic_year.closed_for_academics?
      errors.add(:base, "El calendario de un ciclo cerrado es de solo lectura")
    end
  end

  def consistent_dates
    errors.add(:ends_at, "debe ser posterior al inicio") if starts_at && ends_at && ends_at <= starts_at
    errors.add(:group, "no pertenece al ciclo") if group && group.academic_year_id != academic_year_id
  end

  def valid_source_url
    return if source_url.blank?
    uri = URI.parse(source_url)
    errors.add(:source_url, "debe ser una URL http o https") unless %w[http https].include?(uri.scheme) && uri.host.present?
  rescue URI::InvalidURIError
    errors.add(:source_url, "debe ser una URL válida")
  end
end
