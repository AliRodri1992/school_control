class LegacySchoolDataBackfill
  def initialize(country_code: "MX")
    @country_code = country_code
  end

  def call
    result = { contacts: 0, addresses: 0, phone_numbers: 0, phone_reviews: 0 }
    StudentContact.includes(:student).find_each do |legacy|
      Contact.transaction do
        contact = Contact.find_or_initialize_by(legacy_student_contact_id: legacy.id)
        contact.assign_attributes(contactable: legacy.student, name: legacy.name,
          relationship: legacy.relationship, email: legacy.email,
          emergency: legacy.emergency, pickup_authorized: legacy.pickup_authorized,
          legacy_phone: legacy.phone)
        was_new = contact.new_record?
        contact.save!
        result[:contacts] += 1 if was_new
        next if contact.phone_numbers.exists?(purpose: "mobile")

        number = normalized_phone(legacy.phone)
        if number
          contact.phone_numbers.create!(purpose: "mobile", number_e164: number, country_code: @country_code)
          result[:phone_numbers] += 1
        else
          result[:phone_reviews] += 1
        end
      end
    end

    Student.find_each do |student|
      result[:addresses] += 1 if ensure_address(student, student.address)
      result[:phone_numbers] += 1 if ensure_phone(student, student.emergency_phone, "emergency")
      result[:phone_reviews] += 1 if student.emergency_phone.present? && normalized_phone(student.emergency_phone).nil?
    end

    School.find_each do |school|
      result[:addresses] += 1 if ensure_address(school, school.address)
      result[:phone_numbers] += 1 if ensure_phone(school, school.phone, "work")
      result[:phone_reviews] += 1 if school.phone.present? && normalized_phone(school.phone).nil?
    end
    result
  end

  private

  def ensure_address(owner, original)
    return false if original.blank? || owner.addresses.where(purpose: "home").exists?
    owner.addresses.create!(country_code: @country_code, purpose: "home", primary: true, line1: original)
    true
  end

  def ensure_phone(owner, original, purpose)
    number = normalized_phone(original)
    return false unless number
    return false if owner.phone_numbers.where(purpose: purpose).exists?
    owner.phone_numbers.create!(number_e164: number, country_code: @country_code, purpose: purpose, primary: true)
    true
  end

  def normalized_phone(value)
    SchoolPhoneNormalizer.call(value, country_code: @country_code)
  end
end
