class EnrollmentPolicy < ApplicationPolicy
  def index? = user.can?("enrollments.index")

  def complete?
    SchoolAccess.new(user, "enrollments.complete").allows?(record)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      SchoolAccess.new(user, "enrollments.index").enrollments
    end
  end
end
