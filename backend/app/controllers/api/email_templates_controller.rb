module Api
  class EmailTemplatesController < CatalogController
    before_action :require_admin

    private

    def model = EmailTemplate
    def attributes = params.permit(:key, :locale, :status, :subject, :heading, :body, :html_body, :footer, :accent_color)
  end
end
