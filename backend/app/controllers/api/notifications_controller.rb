module Api
  class NotificationsController < ApplicationController
    def index
      scope = current_user.notifications
      render json: { unread_count: scope.unread.count, items: scope.includes(:event).newest_first.limit(100).map { |item| serialize(item) } }
    end

    def read
      item = current_user.notifications.find(params[:id])
      item.mark_as_read! unless item.read?
      render json: serialize(item)
    end

    private

    def serialize(item)
      { id: item.id, title: item.title, page: item.page, read_at: item.read_at, created_at: item.created_at }
    end
  end
end
