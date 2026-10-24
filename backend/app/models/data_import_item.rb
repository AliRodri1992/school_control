class DataImportItem < ApplicationRecord
  belongs_to :data_import
  validates :row_number, numericality: { only_integer: true, greater_than: 1 }, uniqueness: { scope: :data_import_id }
  validates :record_type, inclusion: { in: %w[Student Subject Group User Grade] }
end
