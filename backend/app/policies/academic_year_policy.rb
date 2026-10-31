class AcademicYearPolicy < ApplicationPolicy
  def index? = user.can?("academic_years.index")
  def show? = user.can?("academic_years.show")
  def create? = SchoolAccess.new(user, "academic_years.create").institution?
  def update? = SchoolAccess.new(user, "academic_years.update").institution?
  def destroy? = SchoolAccess.new(user, "academic_years.destroy").institution?
  def pdf? = SchoolAccess.new(user, "academic_years.pdf").institution?

  class Scope < ApplicationPolicy::Scope
    def resolve
      user.can?("academic_years.index") ? scope.all : scope.none
    end
  end
end
