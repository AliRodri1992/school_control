class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  before_action :require_user
  rescue_from ActiveRecord::RecordNotFound, with: -> { render json: { error: "Registro no encontrado" }, status: :not_found }
  rescue_from ActiveRecord::RecordInvalid, with: :invalid_record
  rescue_from ActiveRecord::RecordNotUnique, with: -> { render json: { error: "El registro ya existe" }, status: :conflict }
  rescue_from ArgumentError, with: ->(error) { render json: { error: error.message }, status: :unprocessable_content }
  rescue_from ActionController::InvalidAuthenticityToken, with: -> { render json: { error: "La sesión expiró. Recarga la página." }, status: :unprocessable_content }

  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id], session_version: session[:session_version], active: true)
  end

  def require_user
    render json: { error: "Inicia sesión" }, status: :unauthorized unless current_user
  end

  def require_admin
    render json: { error: "Acceso restringido a administración" }, status: :forbidden unless current_user.admin?
  end

  def require_educator
    render json: { error: "Acceso restringido a docentes" }, status: :forbidden unless current_user.admin? || current_user.teacher?
  end

  def students_scope
    return Student.all if current_user.admin?
    return current_user.children if current_user.guardian?
    return Student.where(user_id: current_user.id) if current_user.learner?
    Student.where(id: Enrollment.where(group_id: groups_scope.select(:id)).select(:student_id))
  end

  def groups_scope
    return Group.all if current_user.admin?
    return Group.where(id: current_user.courses.select(:group_id)) if current_user.teacher?
    Group.where(id: Enrollment.where(student_id: students_scope.select(:id)).select(:group_id))
  end

  def enrollments_scope
    scope = Enrollment.where(student_id: students_scope.select(:id))
    current_user.teacher? ? scope.where(group_id: groups_scope.select(:id)) : scope
  end

  def courses_scope
    return Course.all if current_user.admin?
    return current_user.courses if current_user.teacher?
    Course.where(group_id: groups_scope.select(:id))
  end

  def audit(record, action)
    AuditEvent.create!(user: current_user, action: action, record_type: record.class.name, record_id: record.id)
  end

  def invalid_record(error)
    render json: { error: error.record.errors.full_messages.join(". "), errors: error.record.errors.to_hash }, status: :unprocessable_content
  end

  def present(record)
    RecordPresenter.call(record)
  end
end
