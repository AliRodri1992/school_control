class FormativeEvaluation < ApplicationRecord
  FIELDS = {
    "languages" => { name: "Lenguajes", subjects: %w[ESP ING ART] },
    "science" => { name: "Saberes y Pensamiento Científico", subjects: %w[MAT CIE] },
    "ethics" => { name: "Ética, Naturaleza y Sociedades", subjects: %w[HIS GEO FCE] },
    "community" => { name: "De lo Humano y lo Comunitario", subjects: %w[EDF VID] }
  }.freeze

  attr_accessor :correction_authorized

  belongs_to :enrollment
  belongs_to :reviewer, class_name: "User", optional: true
  scope :published, -> { where(status: "published") }

  validates :field_code, inclusion: { in: FIELDS.keys }
  validates :term, inclusion: { in: 1..3 }, uniqueness: { scope: %i[enrollment_id field_code] }
  validates :score, numericality: { only_integer: true, greater_than_or_equal_to: 5, less_than_or_equal_to: 10 }
  validate :grade_specific_scale

  def grade_specific_scale
    return unless enrollment && score.present?
    if enrollment.group.grade_level <= 2 && score < 6
      errors.add(:score, "debe estar entre 6 y 10 para primero y segundo grado")
    end
  end
  validates :status, inclusion: { in: %w[draft published] }
  validates :source_kind, inclusion: { in: %w[school transfer] }
  validate :transfer_reference

  def transfer_reference
    return unless source_kind == "transfer"
    errors.add(:source_school, "es obligatoria para evaluaciones de otra escuela") if source_school.blank?
    errors.add(:source_document_ref, "es obligatoria para conservar el soporte del traslado") if source_document_ref.blank?
  end
  validate :protect_published_record
  validate :protect_closed_cycle

  def protect_closed_cycle
    if enrollment && enrollment.academic_year.closed_for_academics? && !correction_authorized
      errors.add(:base, "El ciclo escolar está cerrado; solicite una rectificación autorizada")
    end
  end

  def protect_published_record
    return unless persisted? && status_in_database == "published" && has_changes_to_save? && !correction_authorized
    errors.add(:base, "La evaluación publicada no puede modificarse directamente")
  end

  def self.summary(records, rounding: "truncate")
    grouped = records.select { |item| item.status == "published" }.group_by(&:field_code)
    FIELDS.map do |code, details|
      by_term = grouped.fetch(code, []).index_by(&:term)
      marks = (1..3).map { |term| by_term[term]&.score }
      {
        code: code,
        name: details.fetch(:name),
        terms: marks,
        final: marks.all? ? PrimarySchoolGrading.decimal(marks.sum / 3, mode: rounding) : nil,
        observations: (1..3).map { |term| by_term[term]&.feedback }
      }
    end
  end
end
