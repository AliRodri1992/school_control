class StudentPolicy < ApplicationPolicy
  def index? = user.can?("students.index")
  def show? = user.can?("students.show", record)
  def create? = user.can?("students.create")
  def update? = user.can?("students.update", record)
  def report? = user.can?("students.report", record)

  class Scope < ApplicationPolicy::Scope
    def resolve
      SchoolAccess.new(user, "students.index").students
    end
  end
end
