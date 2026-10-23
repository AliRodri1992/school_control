class CreateAccessRoles < ActiveRecord::Migration[8.1]
  def up
    create_table :access_roles do |t|
      t.string :name, null: false
      t.text :description
      t.string :default_profile
      t.boolean :active, null: false, default: true
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end
    add_index :access_roles, :name, unique: true
    add_index :access_roles, :default_profile, unique: true
    create_table :role_permissions do |t|
      t.references :access_role, null: false, foreign_key: true
      t.string :key, null: false
      t.string :data_scope, null: false
    end
    add_index :role_permissions, [ :access_role_id, :key ], unique: true
    add_check_constraint :role_permissions, "data_scope IN ('institution', 'assigned', 'family', 'self', 'portal')", name: "permission_scope"
    create_table :access_role_assignments do |t|
      t.references :user, null: false, foreign_key: true
      t.references :access_role, null: false, foreign_key: true
      t.timestamps
    end
    add_index :access_role_assignments, [ :user_id, :access_role_id ], unique: true
    # Preserve the four existing portal profiles; future user creation uses the same defaults.
    User.reset_column_information
    User.find_each { |user| AccessRole.assign_default!(user) }
  end

  def down
    drop_table :access_role_assignments
    drop_table :role_permissions
    drop_table :access_roles
  end
end
