module Api
  class EmailTemplatesController < CatalogController
    before_action :require_admin

    private

    # Keep notification kinds grouped, with locales in a predictable order.
    def index_order = %i[key locale id]
    def model = EmailTemplate
    def attributes = params.permit(:key, :locale, :status, :subject, :heading, :body, :html_body, :footer, :accent_color)
  end
end
