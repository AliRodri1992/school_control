class AdmissionDocumentRequirement < ApplicationRecord
  belongs_to :academic_year
  validates :title, presence: true, length: { maximum: 150 }
  validates :grade_level, inclusion: { in: 1..6 }
  validates :title, uniqueness: { scope: %i[academic_year_id grade_level] }
end
