class CreateInstitutionalMessages < ActiveRecord::Migration[8.1 ]
  def change
    create_table :institutional_messages do |t|
      t.references :sender, null: false, foreign_key: { to_table: :users }
      t.references :recipient, null: false, foreign_key: { to_table: :users }
      t.string :subject, null: false
      t.text :body, null: false
      t.datetime :read_at
      t.timestamps
    end
    add_index :institutional_messages, [ :recipient_id, :read_at, :created_at ], name: 'idx_messages_inbox'
  end
end
