module Api
  class CatalogController < ApplicationController
    before_action :require_admin, except: :index

    def index
      render json: collection.order(:id).map { |record| present(record) }
    end

    def create
      record = model.create!(attributes)
      audit(record, "#{model.name}.created")
      render json: present(record), status: :created
    end

    def update
      record = model.find(params[:id])
      record.with_lock do
        record.update!(attributes)
        audit(record, "#{model.name}.updated")
      end
      render json: present(record)
    end

    private

    def collection = model.all
  end
end
