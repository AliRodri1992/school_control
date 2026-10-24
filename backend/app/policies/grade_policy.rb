class GradePolicy < ApplicationPolicy
  def index? = user.can?("grades.index")

  def create?
    access = SchoolAccess.new(user, "grades.create")
    user.can?("grades.create") && access.courses.exists?(record.course_id) &&
      access.enrollments.exists?(record.enrollment_id)
  end

  def review? = user.can?("grades.review", record)
  def publish? = user.can?("grades.publish", record)
  def correct? = user.can?("grades.correct", record)
  def history? = user.can?("grades.history", record)

  class Scope < ApplicationPolicy::Scope
    def resolve
      SchoolAccess.new(user, "grades.index").grades
    end
  end
end
