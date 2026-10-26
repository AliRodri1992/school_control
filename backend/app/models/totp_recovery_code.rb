class TotpRecoveryCode < ApplicationRecord
  belongs_to :totp_credential
  validates :code_digest, presence: true, uniqueness: true
end
