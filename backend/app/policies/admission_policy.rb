class AdmissionPolicy < ApplicationPolicy
  def index? = user.can?("admissions.index")
  def show? = user.can?("admissions.index") && SchoolAccess.new(user, "admissions.index").students.exists?(record.student_id)

  def create?
    user.can?("admissions.create") &&
      SchoolAccess.new(user, "admissions.create").students.exists?(record.student_id)
  end

  def approve? = institution_action?("admissions.approve")
  def reject? = institution_action?("admissions.reject")

  class Scope < ApplicationPolicy::Scope
    def resolve
      Admission.where(student: SchoolAccess.new(user, "admissions.index").students)
    end
  end

  private

  def institution_action?(permission)
    access = SchoolAccess.new(user, permission)
    access.institution? && access.students.exists?(record.student_id)
  end
end
