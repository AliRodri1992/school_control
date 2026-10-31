class CreateFormativeEvidences < ActiveRecord::Migration[8.1]
  def change
    create_table :formative_evidences do |t|
      t.references :enrollment, null: false, foreign_key: true
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.string :field_code, null: false
      t.integer :term, null: false
      t.string :kind, null: false
      t.string :title, null: false
      t.decimal :score, precision: 4, scale: 2, null: false
      t.decimal :weight, precision: 5, scale: 2, null: false
      t.text :feedback
      t.timestamps
    end
    add_index :formative_evidences, %i[enrollment_id field_code term],
      name: "idx_formative_evidence_field_term"
    add_check_constraint :formative_evidences, "term BETWEEN 1 AND 3 AND score BETWEEN 0 AND 10 AND weight > 0 AND weight <= 100",
      name: "formative_evidences_valid_values"
    add_check_constraint :formative_evidences, "field_code IN ('languages','science','ethics','community')",
      name: "formative_evidences_valid_field"
    add_check_constraint :formative_evidences, "kind IN ('exam','project','assignment','activity','observation','rubric')",
      name: "formative_evidences_valid_kind"
    add_column :formative_evaluations, :source_kind, :string, null: false, default: "school"
    add_column :formative_evaluations, :source_school, :string
    add_column :formative_evaluations, :source_document_ref, :string
    add_check_constraint :formative_evaluations, "source_kind IN ('school','transfer')",
      name: "formative_evaluations_valid_source"
  end
end
