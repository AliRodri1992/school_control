module Api
  class ScheduleSlotsController < ApplicationController
    before_action :require_admin, except: :index

    def index
      scope = ScheduleSlot.where(course_id: Course.where(group_id: groups_scope.select(:id)).select(:id))
      render json: scope.includes(course: [ :subject, :teacher, { group: :academic_year } ]).order(:weekday, :starts_minute).map { |record| present(record) }
    end

    def create
      course = Course.find(params.require(:course_id))
      course.group.academic_year.with_lock do
        slot = course.schedule_slots.create!(params.permit(:weekday, :starts_minute, :ends_minute, :room))
        audit(slot, "schedule.created")
        render json: present(slot), status: :created
      end
    end

    def destroy
      slot = ScheduleSlot.find(params[:id])
      slot.course.group.academic_year.with_lock do
        audit(slot, "schedule.deleted")
        slot.destroy!
      end
      head :no_content
    end
  end
end
