module Api
  class CoursesController < CatalogController
    def update
      course = Course.find(params[:id])
      course.group.academic_year.with_lock { super }
    end

    private

    def model = Course
    def attributes = params.permit(:group_id, :subject_id, :teacher_id, :weekly_periods)
    def collection = courses_scope
  end
end
