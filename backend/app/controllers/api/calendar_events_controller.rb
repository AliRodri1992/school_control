module Api
  class CalendarEventsController < CatalogController
    after_action :verify_authorized, only: :destroy
    def destroy
      record = CalendarEvent.find(params[:id])
      authorize record, :destroy?
      audit(record, "calendar.deleted")
      record.destroy!
      head :no_content
    end

    private

    def model = CalendarEvent
    def attributes = params.permit(:academic_year_id, :group_id, :title, :kind, :starts_at, :ends_at, :description)
    def collection
      return CalendarEvent.all if institution_access?
      CalendarEvent.where(group_id: nil).or(CalendarEvent.where(group_id: groups_scope.select(:id)))
    end
  end
end
