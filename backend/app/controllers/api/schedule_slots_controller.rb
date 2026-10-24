module Api
  class ScheduleSlotsController < ApplicationController
    after_action :verify_policy_scoped, only: :index
    after_action :verify_authorized, only: %i[create destroy]
    before_action :require_admin, except: :index

    def index
      scope = policy_scope(ScheduleSlot)
      render json: scope.includes(course: [ :subject, :teacher, { group: :academic_year } ]).order(:weekday, :starts_minute).map { |record| present(record) }
    end

    def create
      course = Course.find(params.require(:course_id))
      course.group.academic_year.with_lock do
        slot = course.schedule_slots.new(params.permit(:weekday, :starts_minute, :ends_minute, :room))
        authorize slot, :create?
        slot.save!
        audit(slot, "schedule.created")
        render json: present(slot), status: :created
      end
    end

    def destroy
      slot = ScheduleSlot.find(params[:id])
      authorize slot, :destroy?
      slot.course.group.academic_year.with_lock do
        audit(slot, "schedule.deleted")
        slot.destroy!
      end
      head :no_content
    end
  end
end
