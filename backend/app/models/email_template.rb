class EmailTemplate < ApplicationRecord
  TYPES = %w[activity welcome admission_update attendance_alert grade_published document_review].freeze
  has_many :email_template_versions, dependent: :restrict_with_error
  before_update :increment_revision, if: :content_modified?
  after_update :store_previous_version, if: :content_modified_in_last_save?

  validates :key, inclusion: { in: TYPES }, uniqueness: { scope: :locale }
  validates :locale, format: { with: /\A[a-z]{2}(?:-[A-Z]{2})?\z/ }
  validates :status, inclusion: { in: %w[draft published archived] }
  validates :subject, :heading, :body, :footer, presence: true
  validates :subject, :heading, :footer, length: { maximum: 200 }
  validates :body, length: { maximum: 5000 }
  validates :html_body, length: { maximum: 15_000 }, allow_blank: true
  validates :accent_color, format: { with: /\A#[0-9a-fA-F]{6}\z/ }

  def self.activity
    find_by(key: "activity", locale: "es", status: "published") ||
      new(key: "activity", locale: "es", subject: "Hay novedades en tu escuela",
        heading: "Tu comunidad, al día",
        body: "Tienes una actualización en el portal escolar. Inicia sesión para consultar los detalles de forma segura.",
        footer: "Este es un aviso de tu comunidad escolar.", accent_color: "#405CF5", status: "published")
  end

  private

  def tracked_fields = %w[subject heading body footer accent_color html_body locale status]

  def content_modified? = (changes.keys & tracked_fields).any?
  def content_modified_in_last_save? = (saved_changes.keys & tracked_fields).any?

  def increment_revision
    self.revision += 1
  end

  def store_previous_version
    snapshot = attributes.slice(*tracked_fields)
    saved_changes.each do |name, (before, _after)|
      snapshot[name] = before if tracked_fields.include?(name)
    end
    email_template_versions.create!(revision: revision - 1, snapshot: snapshot)
  end
end
