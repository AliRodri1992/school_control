class Admission < ApplicationRecord
  belongs_to :student
  belongs_to :academic_year
  has_one :enrollment, dependent: :restrict_with_error
  has_many :document_requirements, -> { order(:title) }, through: :academic_year, source: :admission_document_requirements
  before_validation :assign_folio, on: :create
  validates :student_id, uniqueness: { scope: :academic_year_id }
  validates :folio, presence: true, uniqueness: true, unless: -> { status == "draft" }
  validates :kind, inclusion: { in: %w[new reenrollment] }
  validates :status, inclusion: { in: %w[draft submitted correction_requested approved rejected cancelled] }
  validates :grade_level, inclusion: { in: 1..6 }
  validate :eligible, on: :create
  validate :prevent_closed_cycle_change, on: :update

  def prevent_closed_cycle_change
    if academic_year&.closed_for_academics? && has_changes_to_save?
      errors.add(:base, "El ciclo escolar está cerrado; la solicitud es de solo lectura")
    end
  end

  def missing_requirements(for_formalization: false)
    return [ "Identidad y ciclo escolar" ] unless student && academic_year
    missing = []
    missing << "CURP y fecha de nacimiento" if student.curp.blank? || student.birth_date.blank?
    missing << "Domicilio principal" unless student.addresses.exists?
    missing << "Teléfono de contacto" unless student.phone_numbers.exists?
    missing << "Contacto familiar" unless student.contacts.exists?
    missing << "Tutor responsable" unless student.guardian.present?
    AdmissionDocumentRequirement.where(academic_year: academic_year, grade_level: grade_level).find_each do |requirement|
      needed = for_formalization ? requirement.required_for_formalization? : requirement.required_for_submission?
      next unless needed

      documents = student.student_documents.where(title: requirement.title)
      documents = documents.where(status: for_formalization ? "approved" : %w[pending approved])
      missing << "Documento: #{requirement.title}" unless documents.exists?
    end
    missing
  end

  def complete_for_submission? = missing_requirements.empty?
  def complete_for_enrollment? = missing_requirements(for_formalization: true).empty?

  def assign_folio
    self.folio ||= "ESC-#{SecureRandom.hex(6).upcase}" unless status == "draft"
  end

  def eligible
    return unless academic_year && student
    errors.add(:base, "El ciclo escolar está cerrado") if academic_year.closed_for_academics?
    errors.add(:base, "El periodo de solicitudes está cerrado") unless status == "draft" || academic_year.open_for?(kind)
    eligible_history
  end

  def eligible_history
    return unless academic_year && student
    if kind == "new"
      errors.add(:grade_level, "el nuevo ingreso es a primero") unless grade_level == 1
      errors.add(:student, "ya cuenta con historial; use reinscripción") if student.enrollments.exists?
    else
      previous = student.enrollments.joins(:academic_year).where("academic_years.ends_on < ?", academic_year.starts_on).order("academic_years.ends_on DESC").first
      expected = previous&.outcome == "promoted" ? previous.group.grade_level + 1 : previous&.group&.grade_level
      unless previous&.status == "completed" && %w[promoted repeat].include?(previous.outcome) && grade_level == expected
        errors.add(:grade_level, "no corresponde al resultado del ciclo anterior")
      end
    end
  end
end
