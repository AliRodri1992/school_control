class StudentDocument < ApplicationRecord
  belongs_to :student
  belongs_to :uploader, class_name: "User"
  belongs_to :reviewer, class_name: "User", optional: true
  has_one_attached :file
  validates :title, presence: true, length: { maximum: 150 }
  validates :status, inclusion: { in: %w[pending approved correction_requested] }
  validates :review_notes, presence: true, if: -> { status == "correction_requested" }
  validates :review_notes, length: { maximum: 2000 }
  validate :attached_file

  private

  def attached_file
    errors.add(:file, "es obligatorio") unless file.attached?
  end
end
