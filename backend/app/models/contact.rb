class Contact < ApplicationRecord
  belongs_to :contactable, polymorphic: true
  has_many :phone_numbers, as: :phoneable, dependent: :restrict_with_error

  before_validation :normalize_identity
  normalizes :email, with: ->(value) { value.strip.downcase.presence }
  normalizes :curp, with: ->(value) { value.strip.upcase.presence }

  validates :contactable_type, inclusion: { in: %w[School Student User] }
  validates :name, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :pickup_authorized, inclusion: { in: [ false ] }, unless: -> { contactable_type == "Student" }
  validates :first_name, :middle_name, :paternal_surname, :maternal_surname,
    length: { maximum: 80 }, allow_blank: true
  validates :first_name, :paternal_surname, :curp, presence: true, if: :structured_student_identity?
  validates :curp, uniqueness: { scope: %i[contactable_type contactable_id] },
    allow_blank: true, if: -> { contactable_type == "Student" }
  validates :legacy_phone, format: { with: /\A\+?[0-9 ()-]{7,30}\z/ }, allow_blank: true
  validates :legacy_phone, presence: true, if: :structured_student_identity?
  validate :validate_curp_structure

  private

  def structured_student_identity?
    contactable_type == "Student" &&
      %i[first_name middle_name paternal_surname maternal_surname curp].any? { |key| public_send(key).present? }
  end

  def normalize_identity
    %i[first_name middle_name paternal_surname maternal_surname].each do |key|
      self[key] = self[key].to_s.squish.presence
    end
    self.legacy_phone = legacy_phone.to_s.squish.presence
    return unless structured_student_identity?

    self.name = %i[first_name middle_name paternal_surname maternal_surname]
      .filter_map { |key| self[key] }.join(" ")
  end

  def validate_curp_structure
    if curp.blank?
      self.birth_date = nil
      self.sex = nil
      return
    end

    parsed = FamilyCurp.parse(curp)
    unless parsed
      errors.add(:curp, "debe tener una estructura, fecha y dígito verificador válidos")
      self.birth_date = nil
      self.sex = nil
      return
    end
    self.birth_date = parsed.fetch(:birth_date)
    self.sex = parsed.fetch(:sex)
  end
end
