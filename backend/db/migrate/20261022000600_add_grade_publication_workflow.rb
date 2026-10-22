class AddGradePublicationWorkflow < ActiveRecord::Migration[8.1]
  def up
    add_column :grades, :lock_version, :integer, null: false, default: 0
    add_column :grades, :status, :string, null: false, default: "draft"
    add_column :grades, :reviewed_at, :datetime
    add_column :grades, :published_at, :datetime
    add_reference :grades, :reviewer, foreign_key: { to_table: :users }
    add_check_constraint :grades, "status IN ('draft', 'reviewed', 'published')", name: "grade_publication_status"
    # Previously entered marks were already visible in family and student portals.
    execute "UPDATE grades SET status = 'published', published_at = updated_at"
    create_table :grade_corrections do |t|
      t.references :grade, null: false, foreign_key: true
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.decimal :previous_score, precision: 4, scale: 2, null: false
      t.decimal :score, precision: 4, scale: 2, null: false
      t.text :previous_feedback
      t.text :feedback
      t.text :reason, null: false
      t.timestamps
    end
    add_check_constraint :grade_corrections, "score >= 0 AND score <= 10 AND previous_score >= 0 AND previous_score <= 10", name: "grade_correction_score_range"
  end

  def down
    drop_table :grade_corrections
    remove_check_constraint :grades, name: "grade_publication_status"
    remove_reference :grades, :reviewer, foreign_key: { to_table: :users }
    remove_column :grades, :published_at
    remove_column :grades, :reviewed_at
    remove_column :grades, :status
    remove_column :grades, :lock_version
  end
end
