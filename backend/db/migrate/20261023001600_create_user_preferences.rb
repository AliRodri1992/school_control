class CreateUserPreferences < ActiveRecord::Migration[8.1]
  def change
    create_table :user_preferences do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.references :selected_child, foreign_key: { to_table: :students }
      t.string :locale, null: false, default: "es"
      t.string :theme, null: false, default: "system"
      t.integer :rows_per_page, null: false, default: 15
      t.timestamps
    end
    add_check_constraint :user_preferences, "theme IN ('system', 'light', 'dark')",
      name: "user_preferences_valid_theme"
    add_check_constraint :user_preferences, "rows_per_page IN (10, 15, 25, 50)",
      name: "user_preferences_valid_page_size"
  end
end
