class ReportExport < ApplicationRecord
  belongs_to :user
  has_one_attached :file
  validates :kind, inclusion: { in: SchoolReport::TYPES.keys }
  validates :file_format, inclusion: { in: %w[xlsx pdf] }
  validates :expires_at, presence: true

  def report
    SchoolReport.new(user: user.reload, kind: kind, action: file_format, filters: filters)
  end

  def downloadable?
    status == "ready" && expires_at.future? && access_fingerprint == report.fingerprint
  rescue ArgumentError
    false
  end
end
