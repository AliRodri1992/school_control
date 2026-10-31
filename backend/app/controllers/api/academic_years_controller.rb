module Api
  class AcademicYearsController < CatalogController
    private

    def model = AcademicYear
    def attributes = params.permit(:name, :starts_on, :ends_on, :admissions_open_on, :admissions_close_on, :reenrollment_open_on, :reenrollment_close_on, :first_term_starts_on, :first_term_ends_on, :second_term_starts_on, :second_term_ends_on, :third_term_starts_on, :third_term_ends_on)
  end
end
