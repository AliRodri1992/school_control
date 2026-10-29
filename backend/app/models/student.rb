class Student < ApplicationRecord
  has_many :addresses, as: :addressable, dependent: :restrict_with_error
  has_many :phone_numbers, as: :phoneable, dependent: :restrict_with_error
  has_many :contacts, as: :contactable, dependent: :restrict_with_error
  has_many :notes, as: :notable, dependent: :restrict_with_error
  has_many :student_documents, dependent: :restrict_with_error
  has_many :student_contacts, dependent: :destroy
  belongs_to :guardian, class_name: "User"
  belongs_to :user, optional: true
  has_many :admissions, dependent: :restrict_with_error
  has_many :enrollments, dependent: :restrict_with_error
  normalizes :curp, with: ->(value) { value.strip.upcase }
  validates :first_name, :last_name, :birth_date, presence: true
  validates :curp, uniqueness: true, format: { with: /\A[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\z/, message: "debe tener un formato válido de 18 caracteres" }
  validates :user_id, uniqueness: true, allow_nil: true
  validate :valid_identity

  def full_name = [ first_name, last_name, second_last_name ].compact_blank.join(" ")

  validates :sex, inclusion: { in: %w[female male unspecified] }, allow_blank: true
  validates :nationality, length: { maximum: 80 }, allow_blank: true

  # Enrollment, not application approval alone, determines student membership.
  def enrollment_stage
    enrollments.exists? ? "enrolled" : "applicant"
  end

  def valid_identity
    errors.add(:guardian, "debe ser una cuenta de padre o tutor") unless guardian && (guardian.guardian? || guardian.effective_permissions.values.any? { |scopes| scopes.include?("family") })
    errors.add(:user, "debe ser una cuenta de alumno") if user && !user.learner?
    errors.add(:birth_date, "debe estar en el pasado") if birth_date && birth_date >= Date.current
  end
end
