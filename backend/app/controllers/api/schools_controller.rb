module Api
  class SchoolsController < ApplicationController
    skip_before_action :require_user, only: :show
    before_action :require_admin, only: :update

    def show
      render json: present(School.first!)
    end

    def update
      school = School.first!
      school.update!(params.permit(:name, :code, :address, :phone, :logo))
      audit(school, "school.updated")
      render json: present(school)
    end
  end
end
