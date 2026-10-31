class CreateFormativeEvaluations < ActiveRecord::Migration[8.1]
  def change
    create_table :formative_evaluations do |t|
      t.references :enrollment, null: false, foreign_key: true
      t.string :field_code, null: false
      t.integer :term, null: false
      t.decimal :score, precision: 4, scale: 2, null: false
      t.text :feedback
      t.string :status, null: false, default: "draft"
      t.references :reviewer, foreign_key: { to_table: :users }
      t.datetime :published_at
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end
    add_index :formative_evaluations, [:enrollment_id, :field_code, :term], unique: true,
      name: "idx_formative_evaluations_enrollment_field_term"
    add_check_constraint :formative_evaluations, "field_code IN ('languages','science','ethics','community')",
      name: "formative_evaluation_field"
    add_check_constraint :formative_evaluations, "term BETWEEN 1 AND 3 AND score BETWEEN 5 AND 10",
      name: "formative_evaluation_score_and_term"
    add_check_constraint :formative_evaluations, "status IN ('draft','published')",
      name: "formative_evaluation_status"
  end
end
