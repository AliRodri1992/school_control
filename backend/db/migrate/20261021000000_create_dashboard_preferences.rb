class CreateDashboardPreferences < ActiveRecord::Migration[8.1]
  def change
    create_table :dashboard_preferences do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.jsonb :configuration, null: false, default: {}
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end
  end
end
