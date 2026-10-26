class CreateLoginSessionsAndTotpCredentials < ActiveRecord::Migration[8.1]
  def change
    create_table :user_login_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :token_digest, null: false
      t.string :user_agent, limit: 255
      t.datetime :last_seen_at, null: false
      t.datetime :revoked_at
      t.timestamps
    end
    add_index :user_login_sessions, :token_digest, unique: true

    create_table :totp_credentials do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.text :encrypted_secret, null: false
      t.datetime :enabled_at
      t.bigint :last_used_step, default: -1, null: false
      t.timestamps
    end
    create_table :totp_recovery_codes do |t|
      t.references :totp_credential, null: false, foreign_key: true
      t.string :code_digest, null: false
      t.datetime :used_at
      t.timestamps
    end
    add_index :totp_recovery_codes, :code_digest, unique: true
  end
end
