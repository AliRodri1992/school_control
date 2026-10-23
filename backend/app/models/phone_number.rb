class PhoneNumber < ApplicationRecord
  belongs_to :phoneable, polymorphic: true
  validates :phoneable_type, inclusion: { in: %w[School Student User Contact] }
  validates :number_e164, presence: true, format: { with: /\A\+[1-9]\d{1,14}\z/ }
  validates :purpose, presence: true
end
