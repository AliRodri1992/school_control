class UserPreference < ApplicationRecord
  belongs_to :user
  belongs_to :selected_child, class_name: "Student", optional: true
  validates :locale, format: { with: /\A[a-z]{2}(?:-[A-Z]{2})?\z/ }
  validates :theme, inclusion: { in: %w[system light dark] }
  validates :rows_per_page, inclusion: { in: [ 10, 15, 25, 50 ] }
  validates :time_format, inclusion: { in: %w[12h 24h] }
  validates :date_format, inclusion: { in: %w[dd/mm/yyyy mm/dd/yyyy yyyy-mm-dd] }
  validates :week_start, inclusion: { in: %w[monday sunday] }
  validates :table_density, inclusion: { in: %w[comfortable compact spacious] }
  validates :notification_digest, inclusion: { in: %w[immediate daily weekly] }
  validates :calendar_view, inclusion: { in: %w[month week day] }
  validate :selected_child_belongs_to_user

  private

  def selected_child_belongs_to_user
    return unless selected_child_id
    return if user&.guardian? && user.children.exists?(selected_child_id)
    errors.add(:selected_child, "debe pertenecer a la familia autenticada")
  end
end
