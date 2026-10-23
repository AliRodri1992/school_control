module Api
  class GradeChangeRequestsController < ApplicationController
    before_action :require_educator
    before_action :require_admin, only: :resolve

    def index
      render json: grade.change_requests.includes(:requester, :resolver).order(id: :desc).map { |request| serialize(request) }
    end

    def create
      request = RequestGradeChange.call(grade: grade, actor: current_user, expected_version: params.require(:lock_version),
        attributes: params.permit(:score, :feedback, :reason).to_h.symbolize_keys)
      render json: serialize(request), status: :created
    end

    def resolve
      request = grade.change_requests.find(params[:id])
      ResolveGradeChange.call(request: request, actor: current_user, decision: params.require(:decision), reason: params[:resolution_reason])
      render json: serialize(request)
    end

    private

    def grade
      @grade ||= begin
        scope = access.grades
        scope.find(params[:grade_id])
      end
    end

    def serialize(request)
      request.as_json.merge(requester_name: request.requester.name, resolver_name: request.resolver&.name,
        can_resolve: current_user.can?("grade_change_requests.resolve", request.grade) && request.status == "pending" && request.requester_id != current_user.id)
    end
  end
end
