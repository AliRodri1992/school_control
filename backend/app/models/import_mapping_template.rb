class ImportMappingTemplate < ApplicationRecord
  KINDS = %w[students subjects groups teachers tutors grades].freeze

  belongs_to :user
  validates :name, presence: true, length: { maximum: 100 }, uniqueness: { scope: %i[user_id kind] }
  validates :kind, inclusion: { in: KINDS }
  validate :valid_mapping

  def self.allowed_fields(kind)
    case kind
    when "students" then ValidateStudentImport::FIELDS
    when "teachers", "tutors" then ValidateUserImport::FIELDS
    when "grades" then ValidateGradeImport::FIELDS
    else ValidateCatalogImport::FIELDS.fetch(kind, [])
    end
  end

  def self.required_fields(kind)
    kind == "grades" ? ValidateGradeImport::REQUIRED : allowed_fields(kind)
  end

  private

  def valid_mapping
    unless mapping.is_a?(Hash) && mapping.any? && mapping.all? { |key, value|
      key.is_a?(String) && key.length.between?(1, 150) && value.is_a?(String)
    }
      errors.add(:mapping, "debe contener encabezados y campos válidos")
      return
    end
    destination = mapping.values
    errors.add(:mapping, "contiene campos no autorizados") unless (destination - self.class.allowed_fields(kind)).empty?
    errors.add(:mapping, "repite un campo de destino") unless destination.uniq.length == destination.length
    errors.add(:mapping, "no incluye todos los campos requeridos") unless
      (self.class.required_fields(kind) - destination).empty?
  end
end
