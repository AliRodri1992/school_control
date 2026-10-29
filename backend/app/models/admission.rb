class Admission < ApplicationRecord
  belongs_to :student
  belongs_to :academic_year
  has_one :enrollment, dependent: :restrict_with_error
  before_validation :assign_folio, on: :create
  validates :student_id, uniqueness: { scope: :academic_year_id }
  validates :folio, presence: true, uniqueness: true
  validates :kind, inclusion: { in: %w[new reenrollment] }
  validates :status, inclusion: { in: %w[draft submitted correction_requested approved rejected cancelled] }
  validates :grade_level, inclusion: { in: 1..6 }
  validate :eligible, on: :create

  def complete_for_submission?
    student.present? && student.curp.present? && student.birth_date.present? &&
      student.addresses.exists? && student.phone_numbers.exists? &&
      student.contacts.exists? && student.guardian.present?
  end

  def assign_folio
    self.folio ||= "ESC-#{SecureRandom.hex(6).upcase}"
  end

  def eligible
    return unless academic_year && student
    errors.add(:base, "El periodo de solicitudes está cerrado") unless academic_year.open_for?(kind)
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
