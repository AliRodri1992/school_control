class ReportCardAcknowledgment < ApplicationRecord
  belongs_to :primary_report_card_issue
  belongs_to :guardian, class_name: "User"
  validates :acknowledged_at, presence: true
  validates :guardian_id, uniqueness: { scope: :primary_report_card_issue_id }
end
