class AnnouncementPolicy < ApplicationPolicy
  def index? = user.can?("announcements.index")
  def create? = SchoolAccess.new(user, "announcements.create").institution?
  def update? = SchoolAccess.new(user, "announcements.update").institution?
  def destroy? = SchoolAccess.new(user, "announcements.destroy").institution?

  class Scope < ApplicationPolicy::Scope
    def resolve
      access = SchoolAccess.new(user, "announcements.index")
      return scope.none if access.scopes.empty?
      return scope.all if access.institution?

      scope.where(audience: [ "all", user.role ])
    end
  end
end
