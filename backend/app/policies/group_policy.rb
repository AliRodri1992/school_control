class GroupPolicy < ApplicationPolicy
  def index? = user.can?("groups.index")
  def create? = SchoolAccess.new(user, "groups.create").institution?
  def update? = SchoolAccess.new(user, "groups.update").institution?
  def generate_schedule? = SchoolAccess.new(user, "groups.generate_schedule").institution?

  class Scope < ApplicationPolicy::Scope
    def resolve
      SchoolAccess.new(user, "groups.index").groups
    end
  end
end
