class UserPreference < ApplicationRecord
  belongs_to :user
  belongs_to :selected_child, class_name: "Student", optional: true
  validates :locale, format: { with: /\A[a-z]{2}(?:-[A-Z]{2})?\z/ }
  validates :theme, inclusion: { in: %w[system light dark] }
  validates :rows_per_page, inclusion: { in: [ 10, 15, 25, 50 ] }
  validate :selected_child_belongs_to_user

  private

  def selected_child_belongs_to_user
    return unless selected_child_id
    return if user&.guardian? && user.children.exists?(selected_child_id)
    errors.add(:selected_child, "debe pertenecer a la familia autenticada")
  end
end
