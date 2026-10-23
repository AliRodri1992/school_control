class GradeChangeRequest < ApplicationRecord
  belongs_to :grade
  belongs_to :requester, class_name: "User"
  belongs_to :resolver, class_name: "User", optional: true
  scope :pending, -> { where(status: "pending") }
  validates :status, inclusion: { in: %w[pending approved rejected] }
  validates :reason, presence: true, length: { maximum: 2000 }
  validates :resolution_reason, presence: true, length: { maximum: 2000 }, unless: -> { status == "pending" }
  validates :score, :previous_score, numericality: { in: 0..10 }
  validates :expected_version, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :separate_resolver

  def readonly?
    persisted? && status_in_database != "pending"
  end

  private

  def separate_resolver
    errors.add(:resolver, "debe ser otra persona") if resolver_id.present? && resolver_id == requester_id
  end
end
