class ExtendAcademicCalendarForSchoolCycles < ActiveRecord::Migration[8.1]
  def change
    change_table :academic_years, bulk: true do |t|
      t.string :status, null: false, default: "active"
      t.string :calendar_source, null: false, default: "manual"
      t.string :calendar_source_url
      t.string :calendar_source_reference
      t.date :calendar_published_on
      t.integer :planned_school_days
      t.text :notes
      %w[first second third].each do |term|
        t.date :"#{term}_term_capture_opens_on"
        t.date :"#{term}_term_capture_closes_on"
        t.date :"#{term}_term_review_on"
        t.date :"#{term}_term_reports_on"
      end
    end
    add_index :academic_years, [ :status, :starts_on ]
    add_check_constraint :academic_years, "status IN ('draft','active','closing','closed','archived')", name: "academic_year_status_allowed"
    add_check_constraint :academic_years, "calendar_source IN ('manual','sep','state','school')", name: "academic_year_calendar_source_allowed"
    add_check_constraint :academic_years, "planned_school_days IS NULL OR planned_school_days BETWEEN 1 AND 366", name: "academic_year_school_days_range"

    change_table :calendar_events, bulk: true do |t|
      t.boolean :all_day, null: false, default: false
      t.boolean :official, null: false, default: false
      t.string :source_type, null: false, default: "manual"
      t.string :source_url
      t.string :source_reference
      t.string :external_uid
    end
    legacy_check = connection.check_constraints(:calendar_events).find do |check|
      check.expression.include?("starts_at") && check.expression.include?("kind")
    end
    raise "No se encontró la restricción original del calendario" unless legacy_check
    remove_check_constraint :calendar_events,
                            "starts_at < ends_at AND kind IN ('exam','holiday','meeting','activity')",
                            name: legacy_check.name
    add_check_constraint :calendar_events, "starts_at < ends_at AND kind IN ('exam','holiday','meeting','activity','suspension','vacation','cte','evaluation','report_delivery','administrative')", name: "calendar_event_dates_and_kind"
    add_check_constraint :calendar_events, "source_type IN ('manual','sep','state','school')", name: "calendar_event_source_allowed"
    add_index :calendar_events, [ :academic_year_id, :kind, :starts_at ], name: "idx_calendar_events_year_kind_date"
    add_index :calendar_events, [ :academic_year_id, :external_uid ], unique: true, where: "external_uid IS NOT NULL", name: "idx_calendar_events_import_uid"

    # Only newly introduced actions are granted to existing default administrator roles.
    reversible do |direction|
      direction.up do
        execute <<~SQL
          INSERT INTO role_permissions (access_role_id, key, data_scope)
          SELECT id, action_key, 'institution'
          FROM access_roles
          CROSS JOIN (VALUES ('academic_years.show'), ('academic_years.destroy'), ('academic_years.pdf')) AS actions(action_key)
          WHERE default_profile = 'admin'
          ON CONFLICT (access_role_id, key) DO NOTHING
        SQL
      end
    end
  end
end
