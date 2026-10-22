module Api
  class EmailTemplatesController < CatalogController
    before_action :require_admin

    private

    def model = EmailTemplate
    def attributes = params.permit(:key, :subject, :heading, :body, :footer, :accent_color)
  end
end
