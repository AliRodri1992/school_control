module Api
  class CalendarEventsController < CatalogController
    def destroy
      record = CalendarEvent.find(params[:id])
      audit(record, "calendar.deleted")
      record.destroy!
      head :no_content
    end

    private

    def model = CalendarEvent
    def attributes = params.permit(:academic_year_id, :group_id, :title, :kind, :starts_at, :ends_at, :description)
    def collection
      return CalendarEvent.all if current_user.admin?
      CalendarEvent.where(group_id: nil).or(CalendarEvent.where(group_id: groups_scope.select(:id)))
    end
  end
end
