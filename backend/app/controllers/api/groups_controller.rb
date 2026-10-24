module Api
  class GroupsController < CatalogController
    after_action :verify_authorized, only: :generate_schedule
    def generate_schedule
      group = Group.find(params[:id])
      authorize group, :generate_schedule?
      GenerateSchedule.call(group: group)
      audit(group, "schedule.generated")
      render json: { message: "Horario generado" }
    end

    private

    def model = Group
    def attributes = params.permit(:academic_year_id, :grade_level, :section, :capacity)
    def collection = groups_scope
  end
end
