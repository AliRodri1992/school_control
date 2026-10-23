module Api
  class DocsController < ApplicationController
    skip_before_action :authorize_permission

    def show
      render json: JSON.parse(Rails.root.join("openapi/v1.json").read)
    end
  end
end
