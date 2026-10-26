class ExtendUserPreferencesForPersonalization < ActiveRecord::Migration[8.1]
  def change
    change_table :user_preferences, bulk: true do |t|
      t.string :time_format, null: false, default: "24h"
      t.string :date_format, null: false, default: "dd/mm/yyyy"
      t.string :week_start, null: false, default: "monday"
      t.string :table_density, null: false, default: "comfortable"
      t.boolean :reduce_motion, null: false, default: false
      t.boolean :high_contrast, null: false, default: false
      t.boolean :large_text, null: false, default: false
      t.boolean :hide_sensitive_data, null: false, default: false
      t.boolean :hide_notification_previews, null: false, default: false
      t.boolean :remember_filters, null: false, default: false
      t.boolean :notification_email, null: false, default: true
      t.boolean :notification_school, null: false, default: true
      t.boolean :notification_grades, null: false, default: true
      t.boolean :notification_attendance, null: false, default: true
      t.boolean :notification_events, null: false, default: true
      t.string :notification_digest, null: false, default: "immediate"
      t.string :calendar_view, null: false, default: "month"
      t.bigint :preferred_group_id
    end
    add_index :user_preferences, :preferred_group_id
  end
end
