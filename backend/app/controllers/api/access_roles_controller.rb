module Api
  class AccessRolesController < ApplicationController
    def index
      render json: { roles: AccessRole.includes(:role_permissions).order(:name).map { |role| serialize(role) },
        catalog: PermissionCatalog.keys.map { |key| { key: key, scopes: PermissionCatalog.scopes(key) } },
        users: User.order(:name).map { |user| { id: user.id, name: user.name, active: user.active, access_role_ids: user.access_role_ids } },
        effective_permissions: current_user.effective_permissions }
    end

    def create
      render json: serialize(save(AccessRole.new)), status: :created
    end

    def update
      render json: serialize(save(AccessRole.find(params[:id])))
    end

    def assign
      user = ManageAccess.assign(user: User.find(params.require(:user_id)), actor: current_user, role_ids: params.fetch(:access_role_ids, []))
      render json: { id: user.id, access_role_ids: user.access_role_ids }
    end

    private

    def save(role)
      grants = params.permit(permissions: [ :key, :data_scope ]).fetch(:permissions, []).map { |grant| grant.to_h.symbolize_keys }
      ManageAccess.save_role(role: role, actor: current_user, attributes: params.permit(:name, :description, :active).to_h.symbolize_keys,
        permissions: grants, expected_version: params[:lock_version])
    end

    def serialize(role)
      role.as_json(only: %i[id name description active lock_version default_profile]).merge(
        permissions: role.role_permissions.map { |permission| { key: permission.key, data_scope: permission.data_scope } })
    end
  end
end
