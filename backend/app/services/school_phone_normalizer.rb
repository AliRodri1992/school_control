class SchoolPhoneNormalizer
  def self.call(value, country_code: "MX")
    return if value.blank?

    digits = value.to_s.gsub(/\D/, "")
    number = if value.to_s.strip.start_with?("+")
      "+#{digits}"
    elsif digits.length == 10 && country_code == "MX"
      "+52#{digits}"
    elsif digits.length.between?(8, 15)
      "+#{digits}"
    end

    number if number&.match?(/\A\+[1-9]\d{1,14}\z/)
  end
end
