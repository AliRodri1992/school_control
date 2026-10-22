class User < ApplicationRecord
  has_many :notifications, as: :recipient, dependent: :destroy, class_name: "Noticed::Notification"
  has_one :dashboard_preference, dependent: :destroy
  has_secure_password
  generates_token_for :password_recovery, expires_in: 15.minutes do
    session_version
  end
  before_update :invalidate_sessions, if: :credentials_changed?
  normalizes :email, with: ->(value) { value.strip.downcase }
  has_many :children, class_name: "Student", foreign_key: :guardian_id, dependent: :restrict_with_error
  has_one :student, dependent: :nullify
  has_many :courses, foreign_key: :teacher_id, dependent: :restrict_with_error
  validates :name, :email, presence: true
  validates :email, uniqueness: { case_sensitive: false }, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, inclusion: { in: %w[admin teacher guardian student] }
  validates :password, length: { minimum: 12 }, allow_nil: true

  def revoke_sessions!
    with_lock { increment!(:session_version) }
  end

  private

  def credentials_changed?
    will_save_change_to_password_digest? || will_save_change_to_email? || will_save_change_to_active?
  end

  def invalidate_sessions
    self.session_version += 1
  end

  public

  def admin? = role == "admin"
  def teacher? = role == "teacher"
  def guardian? = role == "guardian"
  def learner? = role == "student"
end
