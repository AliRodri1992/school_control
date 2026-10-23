class CreateLocalizationCatalog < ActiveRecord::Migration[8.1]
  def change
    create_table :languages do |t|
      t.string :code, null: false
      t.string :name, null: false
      t.string :native_name, null: false
      t.string :text_direction, null: false, default: "ltr"
      t.string :status, null: false, default: "draft"
      t.timestamps
    end
    add_index :languages, :code, unique: true
    add_check_constraint :languages, "text_direction IN ('ltr', 'rtl')", name: "language_text_direction"
    add_check_constraint :languages, "status IN ('draft', 'active', 'disabled')", name: "language_status"

    create_table :translation_entries do |t|
      t.references :language, null: false, foreign_key: true
      t.string :key, null: false
      t.text :text, null: false
      t.string :status, null: false, default: "draft"
      t.references :reviewer, foreign_key: { to_table: :users }
      t.datetime :published_at
      t.timestamps
    end
    add_index :translation_entries, %i[language_id key], unique: true
    add_check_constraint :translation_entries, "status IN ('draft', 'published')", name: "translation_entry_status"
  end
end
