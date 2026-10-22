class CreateClassroomAssignments < ActiveRecord::Migration[8.1]
  def change
    create_table :assignments do |t|
      t.references :course, null: false, foreign_key: true
      t.string :title, null: false
      t.text :instructions, null: false
      t.datetime :due_at, null: false
      t.boolean :published, null: false, default: false
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end
    create_table :assignment_submissions do |t|
      t.references :assignment, null: false, foreign_key: true
      t.references :enrollment, null: false, foreign_key: true
      t.text :body, null: false
      t.datetime :submitted_at, null: false
      t.decimal :score, precision: 4, scale: 2
      t.text :feedback
      t.references :reviewer, foreign_key: { to_table: :users }
      t.datetime :reviewed_at
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end
    add_index :assignment_submissions, [ :assignment_id, :enrollment_id ], unique: true
    add_check_constraint :assignment_submissions, "score >= 0 AND score <= 10", name: "submission_score_range"
  end
end
