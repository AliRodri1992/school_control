module Api
  class SubjectsController < CatalogController
    private

    def model = Subject
    def attributes = params.permit(:name, :code)
  end
end
