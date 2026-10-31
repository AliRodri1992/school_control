class PermissionCatalog
  ACTIONS = {
    "students" => %w[index show create update report], "admissions" => %w[index create approve reject],
    "enrollments" => %w[index complete], "grades" => %w[index create review publish correct history],
    "grade_change_requests" => %w[index create resolve], "attendances" => %w[index create],
    "assignments" => %w[index create update submissions submit review], "student_documents" => %w[index create download review],
    "student_contacts" => %w[index create update destroy], "academic_years" => %w[index show create update destroy pdf],
    "groups" => %w[index create update generate_schedule], "courses" => %w[index create update],
    "subjects" => %w[index create update], "schedule_slots" => %w[index create destroy],
    "calendar_events" => %w[index create update destroy], "announcements" => %w[index create destroy],
    "users" => %w[index create update], "schools" => %w[update], "email_templates" => %w[index create update],
    "reports" => %w[index],
    "report_enrollments" => %w[preview xlsx pdf], "report_grades" => %w[preview xlsx pdf],
    "report_attendances" => %w[preview xlsx pdf], "report_admissions" => %w[preview xlsx pdf],
    "report_schedules" => %w[preview xlsx pdf], "report_audit" => %w[preview xlsx pdf],
    "access_roles" => %w[index create update assign], "dashboard" => %w[show]
  }.freeze
  RELATIONAL = %w[students admissions enrollments grades grade_change_requests attendances assignments student_documents student_contacts groups courses schedule_slots calendar_events dashboard].freeze
  EDUCATOR = %w[grades.create grades.history grade_change_requests.index grade_change_requests.create attendances.create assignments.create assignments.update assignments.review].freeze
  FAMILY = %w[students.create students.update admissions.create student_contacts.index student_contacts.create student_contacts.update student_contacts.destroy student_documents.index student_documents.create student_documents.download].freeze
  READ = %w[students.index students.show students.report admissions.index enrollments.index grades.index attendances.index assignments.index assignments.submissions academic_years.index academic_years.show groups.index courses.index subjects.index schedule_slots.index calendar_events.index announcements.index dashboard.show].freeze

  def self.keys = ACTIONS.flat_map { |mod, actions| actions.map { |action| "#{mod}.#{action}" } }

  def self.scopes(key)
    return [] unless keys.include?(key)
    return %w[institution assigned family self] if key.start_with?("report_") && !key.start_with?("report_audit.")
    mod, action = key.split(".")
    return %w[institution portal] if key == "announcements.index"
    return %w[institution] unless RELATIONAL.include?(mod)
    return %w[institution] if %w[approve reject complete correct publish resolve generate_schedule destroy].include?(action) && !%w[student_contacts].include?(mod)
    return %w[institution] if %w[groups courses calendar_events].include?(mod) && action != "index"
    return %w[institution] if key == "student_documents.review" || key == "grades.review"
    return %w[institution assigned] if EDUCATOR.include?(key)
    return %w[institution family] if FAMILY.include?(key)
    return %w[self] if key == "assignments.submit"
    return %w[institution] unless %w[index show report submissions].include?(action)
    %w[institution assigned family self]
  end

  def self.defaults(profile)
    selected = case profile
    when "admin" then keys
    when "teacher" then READ + EDUCATOR
    when "guardian" then READ + FAMILY
    when "student" then READ + [ "assignments.submit" ]
    else []
    end
    scope = { "admin" => "institution", "teacher" => "assigned", "guardian" => "family", "student" => "self" }.fetch(profile)
    selected += %w[reports.index report_grades.preview report_attendances.preview report_enrollments.preview report_schedules.preview] unless profile == "admin"
    selected.to_h { |key| [ key, key == "announcements.index" && profile != "admin" ? "portal" : (scopes(key).include?(scope) ? scope : scopes(key).first) ] }
  end
end
