class DataImport < ApplicationRecord
  belongs_to :user
  has_many :data_import_items, dependent: :restrict_with_error
  has_one_attached :file
  validates :kind, inclusion: { in: %w[students subjects groups teachers tutors grades] }
  validates :status, inclusion: { in: %w[uploaded validated queued processing completed failed] }
  validate :valid_file

  private

  def valid_file
    unless file.attached?
      errors.add(:file, "no puede estar vacío")
      return
    end
    errors.add(:file, "supera 5 MB") if file.blob.byte_size > 5.megabytes
    errors.add(:file, "debe ser CSV o Excel XLSX") unless %w[csv xlsx].include?(file.filename.extension.to_s.downcase)
  end
end
