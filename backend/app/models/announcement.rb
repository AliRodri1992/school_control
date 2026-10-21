class Announcement < ApplicationRecord
  validates :title, :body, presence: true
  validates :audience, inclusion: { in: %w[all guardian teacher student] }
end
