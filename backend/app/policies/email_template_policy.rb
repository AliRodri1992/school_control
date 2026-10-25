class EmailTemplatePolicy < ApplicationPolicy
  def index? = SchoolAccess.new(user, "email_templates.index").institution?
  def create? = SchoolAccess.new(user, "email_templates.create").institution?
  def update? = SchoolAccess.new(user, "email_templates.update").institution?

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless SchoolAccess.new(user, "email_templates.index").institution?

      scope.all
    end
  end
end
