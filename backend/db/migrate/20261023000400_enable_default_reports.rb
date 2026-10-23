class EnableDefaultReports < ActiveRecord::Migration[8.1]
  def up
    sources = { "enrollments" => "enrollments.index", "grades" => "grades.index", "attendances" => "attendances.index", "admissions" => "admissions.index", "schedules" => "schedule_slots.index", "audit" => "access_roles.update" }
    AccessRole.where.not(default_profile: nil).find_each do |role|
      role.role_permissions.find_or_create_by!(key: "reports.index") { |p| p.data_scope = "institution" }
      sources.each do |kind, source|
        permission = role.role_permissions.find_by(key: source)
        next unless permission
        actions = role.default_profile == "admin" ? %w[preview xlsx pdf] : %w[preview]
        actions.each do |action|
          role.role_permissions.find_or_create_by!(key: "report_#{kind}.#{action}") { |p| p.data_scope = permission.data_scope }
        end
      end
    end
  end

  def down
    RolePermission.where("key LIKE 'report_%' OR key = 'reports.index'").delete_all
  end
end
