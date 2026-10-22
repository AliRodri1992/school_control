class EmailTemplate < ApplicationRecord
  validates :key, inclusion: { in: %w[activity] }, uniqueness: true
  validates :subject, :heading, :body, :footer, presence: true
  validates :subject, :heading, :footer, length: { maximum: 200 }
  validates :body, length: { maximum: 5000 }
  validates :accent_color, format: { with: /\A#[0-9a-fA-F]{6}\z/ }

  def self.activity
    find_by(key: "activity") || new(key: "activity", subject: "Hay novedades en tu escuela", heading: "Tu comunidad, al día", body: "Tienes una actualización en el portal escolar. Inicia sesión para consultar los detalles de forma segura.", footer: "Este es un aviso de tu comunidad escolar.", accent_color: "#2563eb")
  end
end
