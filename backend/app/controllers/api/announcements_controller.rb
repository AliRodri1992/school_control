module Api
  class AnnouncementsController < CatalogController
    after_action :verify_authorized, only: :destroy
    def destroy
      record = Announcement.find(params[:id])
      authorize record, :destroy?
      audit(record, "announcement.deleted")
      record.destroy!
      head :no_content
    end

    private

    def model = Announcement
    def attributes = params.permit(:title, :body, :audience)
    def collection
      institution_access? ? Announcement.all : Announcement.where(audience: [ "all", current_user.role ])
    end
  end
end
