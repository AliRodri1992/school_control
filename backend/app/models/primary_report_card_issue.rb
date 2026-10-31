class PrimaryReportCardIssue < ApplicationRecord
  belongs_to :enrollment
  belongs_to :issued_by, class_name: "User"
  has_one_attached :file
  has_many :report_card_acknowledgments, dependent: :restrict_with_error
  validates :term, inclusion: { in: 0..3 }
  validates :version, numericality: { only_integer: true, greater_than: 0 },
    uniqueness: { scope: %i[enrollment_id term] }
  validates :sha256, :rule_version, presence: true
  validate :immutable_issue, on: :update

  def immutable_issue
    errors.add(:base, "La boleta emitida es inmutable; emita una nueva versión") if
      changes_to_save.except("updated_at").present?
  end
end
