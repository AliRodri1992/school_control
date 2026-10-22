class CreateSchoolNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :noticed_events do |t|
      t.string :type
      t.belongs_to :record, polymorphic: true
      t.jsonb :params
      t.integer :notifications_count
      t.timestamps
    end
    create_table :noticed_notifications do |t|
      t.string :type
      t.belongs_to :event, null: false, foreign_key: { to_table: :noticed_events }
      t.belongs_to :recipient, polymorphic: true, null: false
      t.datetime :read_at
      t.datetime :seen_at
      t.timestamps
    end
    add_index :noticed_notifications, :read_at
    add_column :users, :email_notifications, :boolean, null: false, default: false
    create_table :email_templates do |t|
      t.string :key, null: false
      t.string :subject, null: false
      t.string :heading, null: false
      t.text :body, null: false
      t.string :footer, null: false
      t.string :accent_color, null: false, default: "#2563eb"
      t.timestamps
    end
    add_index :email_templates, :key, unique: true
  end
end
