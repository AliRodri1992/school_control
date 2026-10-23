class Contact < ApplicationRecord
  belongs_to :contactable, polymorphic: true
  has_many :phone_numbers, as: :phoneable, dependent: :restrict_with_error
  validates :contactable_type, inclusion: { in: %w[School Student User] }
  validates :name, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :pickup_authorized, inclusion: { in: [ false ] }, unless: -> { contactable_type == "Student" }
end
