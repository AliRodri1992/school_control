require "openssl"
require "base64"

class TotpAuthenticator
  ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".freeze

  def self.generate_secret
    encode(SecureRandom.random_bytes(20))
  end

  def self.encrypt(secret)
    encryptor.encrypt_and_sign(secret)
  end

  def self.decrypt(ciphertext)
    encryptor.decrypt_and_verify(ciphertext)
  end

  def self.uri(secret, email)
    "otpauth://totp/#{ERB::Util.url_encode("School Control:#{email}")}?" \
      "secret=#{secret}&issuer=#{ERB::Util.url_encode('School Control')}&algorithm=SHA1&digits=6&period=30"
  end

  def self.valid_step(secret, code, after: -1, at: Time.current)
    return unless code.to_s.match?(/\A\d{6}\z/)

    step = at.to_i / 30
    [ step - 1, step, step + 1 ].find do |candidate|
      next false if candidate <= after
      ActiveSupport::SecurityUtils.secure_compare(hotp(secret, candidate), code.to_s)
    end
  end

  def self.hotp(secret, counter)
    key = decode(secret)
    digest = OpenSSL::HMAC.digest("SHA1", key, [ counter ].pack("Q>"))
    offset = digest.getbyte(19) & 0xf
    binary = digest.byteslice(offset, 4).unpack1("N") & 0x7fffffff
    format("%06d", binary % 1_000_000)
  end

  def self.recovery_digest(code)
    Digest::SHA256.hexdigest("school-control-recovery:#{Rails.application.secret_key_base}:#{code.to_s.strip.upcase}")
  end

  def self.encode(raw)
    raw.unpack1("B*").scan(/.{1,5}/).map { |chunk| ALPHABET[chunk.ljust(5, "0").to_i(2)] }.join
  end

  def self.decode(base32)
    bits = base32.to_s.upcase.chars.map do |char|
      index = ALPHABET.index(char)
      raise ArgumentError, "Secreto de autenticación inválido" unless index
      index.to_s(2).rjust(5, "0")
    end.join
    bits.scan(/.{8}/).map { |byte| byte.to_i(2) }.pack("C*")
  end

  def self.encryptor
    ActiveSupport::MessageEncryptor.new(
      Rails.application.key_generator.generate_key("school-control-totp-v1", 32)
    )
  end
end
