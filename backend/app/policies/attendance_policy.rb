class AttendancePolicy < ApplicationPolicy
  def index? = user.can?("attendances.index")

  def create?
    user.can?("attendances.create") &&
      SchoolAccess.new(user, "attendances.create").enrollments.exists?(record.enrollment_id)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      access = SchoolAccess.new(user, "attendances.index")
      Attendance.where(enrollment: access.enrollments)
    end
  end
end
