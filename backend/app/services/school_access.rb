class SchoolAccess
  def initialize(user, permission)
    @user, @permission = user, permission
  end

  def scopes
    return [] unless @user&.active?
    RolePermission.joins(access_role: :access_role_assignments)
      .where(access_roles: { active: true }, access_role_assignments: { user_id: @user.id }, key: @permission).distinct.pluck(:data_scope)
  end

  def institution? = scopes.include?("institution")
  def educator? = (scopes & %w[institution assigned]).any?

  def students
    return Student.all if institution?
    ids = []
    ids.concat(@user.children.ids) if scopes.include?("family")
    ids.concat(Student.where(user_id: @user.id).ids) if scopes.include?("self")
    ids.concat(Enrollment.where(group_id: @user.courses.select(:group_id)).pluck(:student_id)) if scopes.include?("assigned")
    Student.where(id: ids)
  end

  def groups
    return Group.all if institution?
    ids = []
    ids.concat(@user.courses.pluck(:group_id)) if scopes.include?("assigned")
    if (scopes & %w[family self]).any?
      family_students = Student.none
      family_students = family_students.or(@user.children) if scopes.include?("family")
      family_students = family_students.or(Student.where(user_id: @user.id)) if scopes.include?("self")
      ids.concat(Enrollment.where(student_id: family_students.select(:id)).pluck(:group_id))
    end
    Group.where(id: ids)
  end

  def enrollments = Enrollment.where(student: students, group: groups)

  def courses
    return Course.all if institution?
    scope = Course.none
    scope = scope.or(@user.courses) if scopes.include?("assigned")
    if (scopes & %w[family self]).any?
      related = Student.none
      related = related.or(@user.children) if scopes.include?("family")
      related = related.or(Student.where(user_id: @user.id)) if scopes.include?("self")
      scope = scope.or(Course.where(group_id: Enrollment.where(student: related).select(:group_id)))
    end
    scope
  end

  def grades
    # A family grant must never expose internal marks through another teacher grant.
    result = Grade.none
    result = Grade.all if institution?
    result = result.or(Grade.where(course: @user.courses)) if scopes.include?("assigned")
    result = result.or(Grade.published.where(enrollment: Enrollment.where(student: @user.children))) if scopes.include?("family")
    result = result.or(Grade.published.where(enrollment: Enrollment.where(student: Student.where(user_id: @user.id)))) if scopes.include?("self")
    result
  end

  def allows?(record = nil)
    return false if scopes.empty?
    return true if record.nil? || institution?
    case record
    when Grade then grades.exists?(record.id)
    when Student then students.exists?(record.id)
    when Enrollment then enrollments.exists?(record.id)
    when Course then courses.exists?(record.id)
    else false
    end
  end
end
