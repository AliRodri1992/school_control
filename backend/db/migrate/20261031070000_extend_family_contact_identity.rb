class ExtendFamilyContactIdentity < ActiveRecord::Migration[8.1]
  def change
    %i[student_contacts contacts].each do |table|
      add_column table, :first_name, :string, limit: 80
      add_column table, :middle_name, :string, limit: 80
      add_column table, :paternal_surname, :string, limit: 80
      add_column table, :maternal_surname, :string, limit: 80
      add_column table, :curp, :string, limit: 18
      add_column table, :birth_date, :date
      add_column table, :sex, :string, limit: 1
      add_check_constraint table, "sex IS NULL OR sex IN ('H', 'M')", name: "#{table}_curp_sex"
    end
    add_index :student_contacts, %i[student_id curp], unique: true,
      where: "curp IS NOT NULL", name: "index_student_contacts_unique_curp_per_student"
  end
end
