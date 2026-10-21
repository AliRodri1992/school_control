class Subject < ApplicationRecord
  has_many :courses, dependent: :restrict_with_error
  validates :name, :code, presence: true
  validates :code, uniqueness: true
end
