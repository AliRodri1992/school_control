class CreateStudentContacts < ActiveRecord::Migration[8.1]
  def change
    create_table :student_contacts do |t|
      t.references :student, null: false, foreign_key: true
      t.string :name, null: false
      t.string :relationship, null: false
      t.string :phone, null: false
      t.string :email
      t.boolean :emergency, null: false, default: false
      t.boolean :pickup_authorized, null: false, default: false
      t.timestamps
    end
    add_index :student_contacts, [ :student_id, :name, :phone ], unique: true
  end
end
