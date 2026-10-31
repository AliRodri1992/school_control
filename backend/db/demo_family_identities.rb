# Deterministic fictional family identities with Mexico-like data.
# CURPs are structurally valid TEST DATA, not issued/verified identifiers.
module DemoFamilyIdentities
  WOMEN = %w[Sofía Elena Lucía Daniela Valeria Natalia Adriana Karla].freeze
  MEN = %w[Daniel Mauricio Gabriel Alejandro Ricardo Eduardo Andrés Roberto].freeze
  MIDDLE = %w[Isabel Fernanda Patricia Alejandra Javier Alberto Manuel Antonio].freeze
  SURNAMES = %w[Hernández González Martínez Rodríguez Ramírez Flores Sánchez Torres Rivera López].freeze
  DIGITS = "0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".freeze

  def self.attributes(serial)
    sex = serial.even? ? "H" : "M"
    first = (sex == "H" ? MEN : WOMEN)[serial % 8]
    middle = MIDDLE[(serial * 3) % MIDDLE.size]
    paternal = SURNAMES[(serial * 7) % SURNAMES.size]
    maternal = SURNAMES[(serial * 3 + 2) % SURNAMES.size]
    born = Date.new(1973 + serial % 23, 1 + serial % 12, 1 + serial % 27)
    letters = [ paternal, maternal, first ].map { |n| unaccent(n) }
    p, m, f = letters
    vowel = p[1..].to_s[/[AEIOU]/] || "X"
    consonants = letters.map { |n| n[1..].to_s[/[BCDFGHJKLMNPQRSTVWXYZ]/] || "X" }.join
    body = "#{p[0]}#{vowel}#{m[0]}#{f[0]}#{born.strftime('%y%m%d')}#{sex}MC#{consonants}#{serial % 10}"
    sum = body.chars.each_with_index.sum { |char, index| DIGITS.index(char) * (18 - index) }
    curp = body + ((10 - sum % 10) % 10).to_s
    { first_name: first, middle_name: middle, paternal_surname: paternal,
      maternal_surname: maternal, curp: curp }
  end

  def self.unaccent(name)
    name.unicode_normalize(:nfkd).gsub(/\p{Mn}/, "").upcase
  end
end
