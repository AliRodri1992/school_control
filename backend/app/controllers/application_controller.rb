class ApplicationController < ActionController::Base
  include Pundit::Authorization
  protect_from_forgery with: :exception
  before_action :require_user
  before_action :authorize_permission
  rescue_from Pundit::NotAuthorizedError, with: -> { render json: { error: "No tienes permiso para esta acción" }, status: :forbidden }
  rescue_from ActiveRecord::RecordNotFound, with: -> { render json: { error: "Registro no encontrado" }, status: :not_found }
  rescue_from ActiveRecord::RecordInvalid, with: :invalid_record
  rescue_from ActiveRecord::RecordNotUnique, with: -> { render json: { error: "El registro ya existe" }, status: :conflict }
  rescue_from ArgumentError, with: ->(error) { render json: { error: error.message }, status: :unprocessable_content }
  rescue_from ActionController::InvalidAuthenticityToken, with: -> { render json: { error: "La sesión expiró. Recarga la página." }, status: :unprocessable_content }

  private

  def current_user
    return @current_user if defined?(@current_user)

    user = User.find_by(id: session[:user_id], session_version: session[:session_version], active: true)
    token_session = current_login_session
    @current_user = token_session&.user_id == user&.id ? user : nil
  end

  def current_login_session
    return @current_login_session if defined?(@current_login_session)

    @current_login_session = UserLoginSession.for_token(session[:login_token])
    if @current_login_session && @current_login_session.last_seen_at < 5.minutes.ago
      @current_login_session.update_column(:last_seen_at, Time.current)
    end
    @current_login_session
  end

  def require_user
    render json: { error: "Inicia sesión" }, status: :unauthorized unless current_user
  end

  def permission_key
    "#{controller_name}.#{action_name}"
  end

  def access = SchoolAccess.new(current_user, permission_key)
  def institution_access? = access.institution?
  def educator_access? = access.educator?

  def authorize_permission
    return if %w[sessions password_resets profiles account_security messages notifications dashboard_preferences two_factor].include?(controller_name)
    return if controller_name == "schools" && action_name == "show"
    render json: { error: "No tienes permiso para esta acción" }, status: :forbidden unless access.allows?
  end

  # All these controllers now authorize the specific module/action in the shared filter.
  def require_admin = authorize_permission
  def require_educator = authorize_permission
  def students_scope = access.students
  def groups_scope = access.groups
  def enrollments_scope = access.enrollments
  def courses_scope = access.courses

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
