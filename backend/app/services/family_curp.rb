# Validates the structural components of a Mexican CURP. This does not
# confirm issuance or ownership with RENAPO.
class FamilyCurp
  VALUES = "0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".freeze
  STATES = %w[AS BC BS CC CL CM CS CH DF DG GT GR HG JC MC MN MS NT NL OC PL QT QR SP SL SR TC TS TL VZ YN ZS NE].freeze
  PATTERN = /\A[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d\z/

  def self.parse(value)
    curp = value.to_s.strip.upcase
    return nil unless curp.match?(PATTERN) && STATES.include?(curp[11, 2])
    checksum = curp[0, 17].chars.each_with_index.sum do |char, index|
      VALUES.index(char).to_i * (18 - index)
    end
    return nil unless (10 - checksum % 10) % 10 == curp[17].to_i

    yy = curp[4, 2].to_i
    # RENAPO uses a numeric homonym character for 1900s births, a letter
    # for 2000s births; do not guess the century from the current year.
    year = (curp[16].match?(/\d/) ? 1900 : 2000) + yy
    date = Date.valid_date?(year, curp[6, 2].to_i, curp[8, 2].to_i) &&
      Date.new(year, curp[6, 2].to_i, curp[8, 2].to_i)
    return nil unless date && date <= Date.current

    { birth_date: date, sex: curp[10] }
  end
end
