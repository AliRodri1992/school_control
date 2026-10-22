class InstitutionalMessage < ApplicationRecord
  belongs_to :sender, class_name: "User"
  belongs_to :recipient, class_name: "User"
  validates :subject, presence: true, length: { maximum: 200 }
  validates :body, presence: true, length: { maximum: 10_000 }
  validate :different_people

  private

  def different_people
    errors.add(:recipient, "debe ser otra persona") if sender_id == recipient_id
  end
end
