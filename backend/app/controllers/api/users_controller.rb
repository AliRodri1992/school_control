module Api
  class UsersController < ApplicationController
    before_action :require_admin

    def index
      render json: User.order(:name).map { |user| present(user) }
    end

    def create
      ManageAccess.transaction do
        raise ArgumentError, "Se requiere permiso para asignar roles" unless current_user.can?("access_roles.assign")
        user = User.new(params.permit(:name, :email, :password, :password_confirmation))
        user.role = params.require(:role)
        user.save!
        grants = user.access_roles.flat_map { |role| role.role_permissions.map { |p| { key: p.key, data_scope: p.data_scope } } }
        ManageAccess.verify_grants!(current_user, grants)
        if user.learner?
          student = Student.find(params.require(:student_id))
          student.with_lock do
            raise ArgumentError, "El alumno ya tiene acceso" if student.user_id
            student.update!(user: user)
          end
        end
        audit(user, "user.created")
        render json: present(user), status: :created
      end
    end

    def update
      user = User.find(params[:id])
      raise ArgumentError, "No puedes desactivar tu propia cuenta" if user == current_user && params[:active] == false
      ManageAccess.transaction do
        user.lock!
        user.update!(params.permit(:name, :email, :active))
        audit(user, "user.updated")
      end
      render json: present(user)
    end
  end
end
