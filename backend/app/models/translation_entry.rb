class TranslationEntry < ApplicationRecord
  belongs_to :language
  belongs_to :reviewer, class_name: "User", optional: true
  validates :key, format: { with: /\A[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+\z/ },
    uniqueness: { scope: :language_id }
  validates :text, presence: true, length: { maximum: 10_000 }
  validates :status, inclusion: { in: %w[draft published] }
  validate :published_by_reviewer
  scope :published, -> { where(status: "published") }

  private

  def published_by_reviewer
    errors.add(:reviewer, "es obligatorio para publicar") if status == "published" && reviewer_id.blank?
  end
end
