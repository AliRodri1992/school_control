class SubjectPolicy < ApplicationPolicy
  def index? = user.can?("subjects.index")
  def create? = SchoolAccess.new(user, "subjects.create").institution?
  def update? = SchoolAccess.new(user, "subjects.update").institution?

  class Scope < ApplicationPolicy::Scope
    def resolve
      user.can?("subjects.index") ? scope.all : scope.none
    end
  end
end
