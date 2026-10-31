class StudentContact < ApplicationRecord
  belongs_to :student
  before_validation :normalize_identity
  after_save :mirror_polymorphic_contact
  before_destroy :remove_polymorphic_mirror

  normalizes :name, :phone, with: ->(value) { value.strip }
  normalizes :email, with: ->(value) { value.strip.downcase.presence }
  normalizes :curp, with: ->(value) { value.strip.upcase.presence }

  validates :name, :relationship, :phone, presence: true, length: { maximum: 150 }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :phone, format: { with: /\A\+?[0-9 ()-]{7,30}\z/ }
  validates :name, uniqueness: { scope: [ :student_id, :phone ] }
  validates :curp, uniqueness: { scope: :student_id }, allow_blank: true
  validates :first_name, :paternal_surname, :curp, presence: true, if: :structured_identity?
  validates :first_name, :middle_name, :paternal_surname, :maternal_surname, length: { maximum: 80 },
    allow_blank: true
  validate :validate_curp_structure

  private

  def structured_identity?
    %i[first_name middle_name paternal_surname maternal_surname curp].any? { |key| public_send(key).present? }
  end

  def normalize_identity
    %i[first_name middle_name paternal_surname maternal_surname].each do |key|
      self[key] = self[key].to_s.squish.presence
    end
    return unless structured_identity?

    self.name = %i[first_name middle_name paternal_surname maternal_surname].filter_map { |key| self[key] }.join(" ")
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

  def mirror_polymorphic_contact
    contact = Contact.find_or_initialize_by(legacy_student_contact_id: id)
    contact.assign_attributes(contactable: student, name: name, relationship: relationship,
      email: email, emergency: emergency, pickup_authorized: pickup_authorized,
      legacy_phone: phone, first_name: first_name, middle_name: middle_name,
      paternal_surname: paternal_surname, maternal_surname: maternal_surname,
      curp: curp, birth_date: birth_date, sex: sex)
    contact.save!
    normalized = SchoolPhoneNormalizer.call(phone)
    unless normalized
      contact.phone_numbers.where(purpose: "mobile").destroy_all
      return
    end

    record = contact.phone_numbers.find_or_initialize_by(purpose: "mobile")
    record.assign_attributes(number_e164: normalized, country_code: "MX")
    record.save!
  end

  def remove_polymorphic_mirror
    contact = Contact.find_by(legacy_student_contact_id: id)
    return unless contact

    contact.phone_numbers.destroy_all
    contact.destroy!
  end
end
