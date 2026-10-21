module Api
  class AnnouncementsController < CatalogController
    def destroy
      record = Announcement.find(params[:id])
      record.destroy!
      head :no_content
    end

    private

    def model = Announcement
    def attributes = params.permit(:title, :body, :audience)
    def collection
      current_user.admin? ? Announcement.all : Announcement.where(audience: [ "all", current_user.role ])
    end
  end
end
