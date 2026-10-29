class CreateAdmissionDocumentRequirements < ActiveRecord::Migration[8.1]
  def change
    create_table :admission_document_requirements do |t|
      t.references :academic_year, null: false, foreign_key: true
      t.integer :grade_level, null: false
      t.string :title, null: false, limit: 150
      t.boolean :required_for_submission, null: false, default: true
      t.boolean :required_for_formalization, null: false, default: true
      t.timestamps
    end
    add_index :admission_document_requirements, %i[academic_year_id grade_level title],
      unique: true, name: "index_admission_required_documents_unique"
    add_check_constraint :admission_document_requirements, "grade_level BETWEEN 1 AND 6",
      name: "admission_required_document_grade"
  end
end
