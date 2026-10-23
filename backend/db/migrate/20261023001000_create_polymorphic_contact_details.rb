class CreatePolymorphicContactDetails < ActiveRecord::Migration[8.1]
  def change
    create_table :addresses do |t|
      t.references :addressable, polymorphic: true, null: false, index: true
      t.string :country_code, limit: 2, null: false
      t.string :purpose, null: false, default: "home"
      t.boolean :primary, null: false, default: false
      t.string :line1, null: false
      t.string :line2
      t.string :neighborhood
      t.string :locality
      t.string :region
      t.string :postal_code
      t.decimal :latitude, precision: 10, scale: 7
      t.decimal :longitude, precision: 10, scale: 7
      t.datetime :verified_at
      t.timestamps
    end
    add_index :addresses, %i[addressable_type addressable_id purpose],
      unique: true, where: '"primary" = TRUE', name: "index_primary_address_per_purpose"

    create_table :phone_numbers do |t|
      t.references :phoneable, polymorphic: true, null: false, index: true
      t.string :number_e164, null: false, limit: 16
      t.string :country_code, limit: 2
      t.string :purpose, null: false, default: "mobile"
      t.string :extension, limit: 12
      t.boolean :primary, null: false, default: false
      t.datetime :verified_at
      t.timestamps
    end
    add_index :phone_numbers, %i[phoneable_type phoneable_id purpose],
      unique: true, where: '"primary" = TRUE', name: "index_primary_phone_per_purpose"

    create_table :contacts do |t|
      t.references :contactable, polymorphic: true, null: false, index: true
      t.string :name, null: false
      t.string :relationship
      t.string :email
      t.boolean :emergency, null: false, default: false
      t.boolean :pickup_authorized, null: false, default: false
      t.boolean :primary, null: false, default: false
      t.integer :priority, null: false, default: 0
      t.timestamps
    end
    add_index :contacts, %i[contactable_type contactable_id],
      unique: true, where: '"primary" = TRUE', name: "index_primary_contact_per_owner"

    create_table :notes do |t|
      t.references :notable, polymorphic: true, null: false, index: true
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.text :body, null: false
      t.string :category, null: false, default: "general"
      t.string :visibility, null: false, default: "internal"
      t.timestamps
    end
    add_check_constraint :notes, "visibility IN ('internal', 'shared')",
      name: "notes_valid_visibility"
  end
end
