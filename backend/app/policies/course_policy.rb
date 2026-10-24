class CoursePolicy < ApplicationPolicy
  def index? = user.can?("courses.index")
  def create? = SchoolAccess.new(user, "courses.create").institution?
  def update? = SchoolAccess.new(user, "courses.update").institution?

  class Scope < ApplicationPolicy::Scope
    def resolve
      SchoolAccess.new(user, "courses.index").courses
    end
  end
end
