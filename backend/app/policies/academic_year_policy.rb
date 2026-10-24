class AcademicYearPolicy < ApplicationPolicy
  def index? = user.can?("academic_years.index")
  def create? = SchoolAccess.new(user, "academic_years.create").institution?
  def update? = SchoolAccess.new(user, "academic_years.update").institution?

  class Scope < ApplicationPolicy::Scope
    def resolve
      user.can?("academic_years.index") ? scope.all : scope.none
    end
  end
end
