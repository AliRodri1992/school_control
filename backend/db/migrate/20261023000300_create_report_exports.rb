class CreateReportExports < ActiveRecord::Migration[8.1]
  def change
    create_table :report_exports do |t|
      t.references :user, null: false, foreign_key: true
      t.string :kind, null: false
      t.string :file_format, null: false
      t.jsonb :filters, null: false, default: {}
      t.string :status, null: false, default: "queued"
      t.string :access_fingerprint
      t.string :error_message
      t.datetime :expires_at, null: false
      t.timestamps
    end
    add_check_constraint :report_exports, "file_format IN ('xlsx', 'pdf')", name: "report_export_format"
    add_check_constraint :report_exports, "status IN ('queued', 'ready', 'failed')", name: "report_export_status"
  end
end
