class MessageRecipients
  def self.call(user)
    active = User.where(active: true).where.not(id: user.id)
    return active if user.admin?

    groups = if user.teacher?
      user.courses.select(:group_id)
    else
      students = user.guardian? ? user.children : Student.where(user_id: user.id)
      Enrollment.where(student_id: students.select(:id), status: "active").select(:group_id)
    end
    students = Student.where(id: Enrollment.where(group_id: groups, status: "active").select(:student_id))
    related = if user.teacher?
      active.where(id: students.select(:guardian_id)).or(active.where(id: students.select(:user_id)))
    else
      active.where(id: Course.where(group_id: groups).select(:teacher_id))
    end
    active.where(role: "admin").or(related).order(:name)
  end
end
