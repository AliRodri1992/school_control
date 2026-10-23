class Address < ApplicationRecord
  belongs_to :addressable, polymorphic: true
  validates :addressable_type, inclusion: { in: %w[School Student User] }
  validates :country_code, presence: true, length: { is: 2 }
  validates :line1, :purpose, presence: true
  validates :latitude, numericality: { greater_than_or_equal_to: -90, less_than_or_equal_to: 90 }, allow_nil: true
  validates :longitude, numericality: { greater_than_or_equal_to: -180, less_than_or_equal_to: 180 }, allow_nil: true
end
