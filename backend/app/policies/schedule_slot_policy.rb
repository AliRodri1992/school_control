class ScheduleSlotPolicy < ApplicationPolicy
  def index? = user.can?("schedule_slots.index")
  def create? = SchoolAccess.new(user, "schedule_slots.create").institution?
  def destroy? = SchoolAccess.new(user, "schedule_slots.destroy").institution?

  class Scope < ApplicationPolicy::Scope
    def resolve
      access = SchoolAccess.new(user, "schedule_slots.index")
      return scope.none if access.scopes.empty?

      scope.where(course_id: Course.where(group_id: access.groups.select(:id)).select(:id))
    end
  end
end
