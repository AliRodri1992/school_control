module Api
  class AcademicYearsController < CatalogController
    private

    def model = AcademicYear
    def attributes = params.permit(:name, :starts_on, :ends_on, :admissions_open_on, :admissions_close_on, :reenrollment_open_on, :reenrollment_close_on)
  end
end
