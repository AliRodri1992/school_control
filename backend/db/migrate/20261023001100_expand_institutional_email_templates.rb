class ExpandInstitutionalEmailTemplates < ActiveRecord::Migration[8.1]
  def change
    add_column :email_templates, :locale, :string, null: false, default: "es"
    add_column :email_templates, :status, :string, null: false, default: "published"
    add_column :email_templates, :html_body, :text
    add_column :email_templates, :revision, :integer, null: false, default: 1
    remove_index :email_templates, :key
    add_index :email_templates, %i[key locale], unique: true, name: "unique_email_template_locale"
    create_table :email_template_versions do |t|
      t.references :email_template, null: false, foreign_key: true
      t.integer :revision, null: false
      t.jsonb :snapshot, null: false, default: {}
      t.timestamps
    end
    add_index :email_template_versions, %i[email_template_id revision], unique: true, name: "unique_email_template_revision"
  end
end
