class StudentContactPolicy < ApplicationPolicy
  def index? = user.can?("student_contacts.index")

  def create?
    allowed_student?("student_contacts.create")
  end

  def update?
    allowed_student?("student_contacts.update")
  end

  def destroy?
    allowed_student?("student_contacts.destroy")
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      students = SchoolAccess.new(user, "student_contacts.index").students
      StudentContact.where(student: students)
    end
  end

  private

  def allowed_student?(permission)
    access = SchoolAccess.new(user, permission)
    access.allows? && access.students.exists?(record.student_id)
  end
end
