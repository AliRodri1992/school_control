class Course < ApplicationRecord
  belongs_to :group
  belongs_to :subject
  belongs_to :teacher, class_name: "User"
  has_many :schedule_slots, dependent: :destroy
  has_many :grades, dependent: :restrict_with_error
  validates :subject_id, uniqueness: { scope: :group_id }
  validates :weekly_periods, numericality: { only_integer: true, in: 1..20 }
  validate :valid_teacher

  def label = "#{group.label} · #{subject.name}"

  def valid_teacher
    errors.add(:teacher, "debe ser un docente activo") unless teacher&.teacher? && teacher.active?
    errors.add(:base, "No se puede reasignar una clase con horarios o calificaciones") if persisted? &&
      (group_id_changed? || teacher_id_changed? || subject_id_changed?) && (schedule_slots.exists? || grades.exists?)
  end
end
