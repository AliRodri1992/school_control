class School < ApplicationRecord
  has_many :addresses, as: :addressable, dependent: :restrict_with_error
  has_many :phone_numbers, as: :phoneable, dependent: :restrict_with_error
  has_many :contacts, as: :contactable, dependent: :restrict_with_error
  has_many :notes, as: :notable, dependent: :restrict_with_error
  has_one_attached :logo
  validates :name, presence: true
  validate :valid_logo

  def valid_logo
    return unless logo.attached?
    errors.add(:logo, "debe ser PNG, JPG o WebP de hasta 2 MB") unless
      %w[image/png image/jpeg image/webp].include?(logo.content_type) && logo.byte_size <= 2.megabytes
  end
end
