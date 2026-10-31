class ScheduleSlot < ApplicationRecord
  belongs_to :course
  validate :cycle_is_editable

  def cycle_is_editable
    errors.add(:base, "El ciclo escolar está cerrado") if course&.group&.academic_year&.closed_for_academics?
  end

  validates :weekday, inclusion: { in: 1..5 }
  validates :starts_minute, numericality: { only_integer: true, greater_than_or_equal_to: 420 }
  validates :ends_minute, numericality: { only_integer: true, less_than_or_equal_to: 1200 }
  validates :room, presence: true
  validate :no_overlap

  def no_overlap
    return unless course && starts_minute && ends_minute
    errors.add(:ends_minute, "debe ser posterior al inicio") unless ends_minute > starts_minute
    overlaps = self.class.joins(course: :group).where(groups: { academic_year_id: course.group.academic_year_id })
      .where(weekday: weekday).where.not(id: id).where("starts_minute < ? AND ends_minute > ?", ends_minute, starts_minute)
      .where("courses.group_id = :group OR courses.teacher_id = :teacher OR room = :room", group: course.group_id, teacher: course.teacher_id, room: room)
    errors.add(:base, "Choque de horario: grupo, docente o aula ocupados") if overlaps.exists?
  end
end
