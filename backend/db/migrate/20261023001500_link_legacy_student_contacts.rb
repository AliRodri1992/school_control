class LinkLegacyStudentContacts < ActiveRecord::Migration[8.1]
  def change
    add_reference :contacts, :legacy_student_contact, index: { unique: true },
      foreign_key: { to_table: :student_contacts }
    add_column :contacts, :legacy_phone, :string
  end
end
