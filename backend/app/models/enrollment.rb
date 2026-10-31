class Enrollment < ApplicationRecord
  belongs_to :student
  belongs_to :academic_year
  belongs_to :group
  belongs_to :admission
  has_many :attendances, dependent: :restrict_with_error
  has_many :grades, dependent: :restrict_with_error
  has_many :formative_evaluations, dependent: :restrict_with_error
  has_many :primary_report_card_issues, dependent: :restrict_with_error
  has_many :formative_evidences, dependent: :restrict_with_error
  validates :student_id, uniqueness: { scope: :academic_year_id }
  validates :admission_id, uniqueness: true
  validates :status, inclusion: { in: %w[active completed] }
  validates :outcome, inclusion: { in: %w[promoted repeat graduated] }, allow_nil: true
  validate :consistent_assignment

  def consistent_assignment
    return unless group && admission
    errors.add(:group, "no corresponde a la solicitud") unless group.academic_year_id == academic_year_id && group.grade_level == admission.grade_level
    errors.add(:admission, "no corresponde al alumno y ciclo") unless admission.student_id == student_id && admission.academic_year_id == academic_year_id
  end
end
