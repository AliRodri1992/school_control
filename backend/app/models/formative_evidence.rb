# Internal learning evidence; its weighted reference NEVER becomes the official mark automatically.
class FormativeEvidence < ApplicationRecord
  KINDS = %w[exam project assignment activity observation rubric].freeze
  belongs_to :enrollment
  belongs_to :author, class_name: "User"
  validates :field_code, inclusion: { in: FormativeEvaluation::FIELDS.keys }
  validates :term, inclusion: { in: 1..3 }
  validates :kind, inclusion: { in: KINDS }
  validates :title, presence: true, length: { maximum: 160 }
  validates :score, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 10 }
  validates :weight, numericality: { greater_than: 0, less_than_or_equal_to: 100 }
  validate :academic_record_open

  def academic_record_open
    return unless enrollment
    if enrollment.status != "active" || enrollment.academic_year.closed_for_academics?
      errors.add(:base, "No se pueden modificar evidencias del ciclo concluido")
    end
  end

  def self.reference(records, rounding: "truncate")
    return nil if records.empty?
    total = records.sum { |entry| entry.weight }
    return nil unless total == BigDecimal("100")
    PrimarySchoolGrading.decimal(records.sum { |entry| entry.score * entry.weight } / total, mode: rounding)
  end
end
