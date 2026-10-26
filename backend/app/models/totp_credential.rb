class TotpCredential < ApplicationRecord
  belongs_to :user
  has_many :recovery_codes, class_name: "TotpRecoveryCode", dependent: :destroy
  validates :encrypted_secret, presence: true

  def self.create_for!(user)
    find_or_initialize_by(user: user).tap do |record|
      raise ArgumentError, "El segundo factor ya está activo." if record.enabled_at?
      record.encrypted_secret = TotpAuthenticator.encrypt(TotpAuthenticator.generate_secret)
      record.last_used_step = -1
      record.enabled_at = nil
      record.save!
    end
  end

  def secret
    TotpAuthenticator.decrypt(encrypted_secret)
  end

  def enabled?
    enabled_at.present?
  end

  def verify!(code)
    with_lock do
      step = TotpAuthenticator.valid_step(secret, code, after: last_used_step)
      if step
        update!(last_used_step: step)
        return true
      end

      code_digest = TotpAuthenticator.recovery_digest(code)
      recovery = recovery_codes.where(code_digest: code_digest, used_at: nil).first
      if recovery
        recovery.update!(used_at: Time.current)
        return true
      end
      false
    end
  end

  def activate!(code)
    raise ArgumentError, "Código de autenticación incorrecto." unless verify!(code)
    update!(enabled_at: Time.current)
    codes = Array.new(8) { SecureRandom.hex(5).upcase }
    recovery_codes.delete_all
    codes.each { |value| recovery_codes.create!(code_digest: TotpAuthenticator.recovery_digest(value)) }
    codes
  end
end
