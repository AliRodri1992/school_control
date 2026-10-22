class StudentContact < ApplicationRecord
  belongs_to :student
  normalizes :name, :phone, with: ->(value) { value.strip }
  normalizes :email, with: ->(value) { value.strip.downcase.presence }
  validates :name, :relationship, :phone, presence: true, length: { maximum: 150 }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :phone, format: { with: /\A\+?[0-9 ()-]{7,30}\z/ }
  validates :name, uniqueness: { scope: [ :student_id, :phone ] }
end
