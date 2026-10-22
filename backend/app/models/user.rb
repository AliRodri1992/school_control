class User < ApplicationRecord
  has_many :notifications, as: :recipient, dependent: :destroy, class_name: "Noticed::Notification"
  has_one :dashboard_preference, dependent: :destroy
  has_secure_password
  normalizes :email, with: ->(value) { value.strip.downcase }
  has_many :children, class_name: "Student", foreign_key: :guardian_id, dependent: :restrict_with_error
  has_one :student, dependent: :nullify
  has_many :courses, foreign_key: :teacher_id, dependent: :restrict_with_error
  validates :name, :email, presence: true
  validates :email, uniqueness: { case_sensitive: false }, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, inclusion: { in: %w[admin teacher guardian student] }
  validates :password, length: { minimum: 12 }, allow_nil: true

  def admin? = role == "admin"
  def teacher? = role == "teacher"
  def guardian? = role == "guardian"
  def learner? = role == "student"
end
