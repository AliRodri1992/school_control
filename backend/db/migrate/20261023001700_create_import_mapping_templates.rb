class CreateImportMappingTemplates < ActiveRecord::Migration[8.1]
  def change
    create_table :import_mapping_templates do |t|
      t.references :user, null: false, foreign_key: true
      t.string :kind, null: false
      t.string :name, null: false
      t.jsonb :mapping, null: false, default: {}
      t.timestamps
    end
    add_index :import_mapping_templates, %i[user_id kind name], unique: true,
      name: "unique_import_template_per_user_and_kind"
  end
end
