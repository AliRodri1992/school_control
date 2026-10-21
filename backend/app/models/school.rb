class School < ApplicationRecord
  has_one_attached :logo
  validates :name, presence: true
  validate :valid_logo

  def valid_logo
    return unless logo.attached?
    errors.add(:logo, "debe ser PNG, JPG o WebP de hasta 2 MB") unless
      %w[image/png image/jpeg image/webp].include?(logo.content_type) && logo.byte_size <= 2.megabytes
  end
end
