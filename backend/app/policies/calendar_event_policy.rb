class CalendarEventPolicy < ApplicationPolicy
  def index? = user.can?("calendar_events.index")
  def create? = SchoolAccess.new(user, "calendar_events.create").institution?
  def update? = SchoolAccess.new(user, "calendar_events.update").institution?
  def destroy? = SchoolAccess.new(user, "calendar_events.destroy").institution?

  class Scope < ApplicationPolicy::Scope
    def resolve
      access = SchoolAccess.new(user, "calendar_events.index")
      return scope.none if access.scopes.empty?
      return scope.all if access.institution?

      scope.where(group_id: nil).or(scope.where(group_id: access.groups.select(:id)))
    end
  end
end
