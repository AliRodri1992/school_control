class StudentDocumentPolicy < ApplicationPolicy
  def index? = user.can?("student_documents.index")

  def create?
    permitted_student?("student_documents.create")
  end

  def download?
    permitted_student?("student_documents.download")
  end

  def review?
    access = SchoolAccess.new(user, "student_documents.review")
    access.institution? && access.students.exists?(record.student_id)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      StudentDocument.where(student: SchoolAccess.new(user, "student_documents.index").students)
    end
  end

  private

  def permitted_student?(permission)
    user.can?(permission) && SchoolAccess.new(user, permission).students.exists?(record.student_id)
  end
end
