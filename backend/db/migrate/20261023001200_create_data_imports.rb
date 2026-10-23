class CreateDataImports < ActiveRecord::Migration[8.1]
  def change
    create_table :data_imports do |t|
      t.references :user, null: false, foreign_key: true
      t.string :kind, null: false, default: "students"
      t.string :status, null: false, default: "uploaded"
      t.jsonb :mapping, null: false, default: {}
      t.jsonb :row_errors, null: false, default: []
      t.integer :total_rows, null: false, default: 0
      t.integer :imported_rows, null: false, default: 0
      t.timestamps
    end
    add_index :data_imports, %i[user_id created_at]
    add_check_constraint :data_imports, "status IN ('uploaded', 'validated', 'queued', 'processing', 'completed', 'failed')",
      name: "data_import_valid_status"
  end
end
