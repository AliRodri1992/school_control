module Api
  class CatalogController < ApplicationController
    after_action :verify_policy_scoped, only: :index
    after_action :verify_authorized, only: %i[create update]
    before_action :require_admin, except: :index

    def index
      render json: policy_scope(model).order(:id).map { |record| present(record) }
    end

    def create
      record = model.new(attributes)
      authorize record, :create?
      record.save!
      audit(record, "#{model.name}.created")
      render json: present(record), status: :created
    end

    def update
      record = model.find(params[:id])
      authorize record, :update?
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
