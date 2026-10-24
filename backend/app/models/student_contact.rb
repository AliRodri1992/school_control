class StudentContact < ApplicationRecord
  belongs_to :student
  after_save :mirror_polymorphic_contact
  before_destroy :remove_polymorphic_mirror
  normalizes :name, :phone, with: ->(value) { value.strip }
  normalizes :email, with: ->(value) { value.strip.downcase.presence }
  validates :name, :relationship, :phone, presence: true, length: { maximum: 150 }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :phone, format: { with: /\A\+?[0-9 ()-]{7,30}\z/ }
  validates :name, uniqueness: { scope: [ :student_id, :phone ] }

  private

  def mirror_polymorphic_contact
    contact = Contact.find_or_initialize_by(legacy_student_contact_id: id)
    contact.assign_attributes(contactable: student, name: name, relationship: relationship,
      email: email, emergency: emergency, pickup_authorized: pickup_authorized,
      legacy_phone: phone)
    contact.save!
    normalized = SchoolPhoneNormalizer.call(phone)
    return unless normalized

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
