class CreateGradeChangeRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :grade_change_requests do |t|
      t.references :grade, null: false, foreign_key: true
      t.references :requester, null: false, foreign_key: { to_table: :users }
      t.references :resolver, foreign_key: { to_table: :users }
      t.integer :expected_version, null: false
      t.decimal :previous_score, precision: 4, scale: 2, null: false
      t.decimal :score, precision: 4, scale: 2, null: false
      t.text :previous_feedback
      t.text :feedback
      t.text :reason, null: false
      t.string :status, null: false, default: "pending"
      t.text :resolution_reason
      t.datetime :resolved_at
      t.timestamps
    end
    add_index :grade_change_requests, :grade_id, unique: true, where: "status = 'pending'", name: "one_pending_grade_change"
    add_check_constraint :grade_change_requests, "status IN ('pending', 'approved', 'rejected')", name: "grade_change_status"
    add_check_constraint :grade_change_requests, "score BETWEEN 0 AND 10 AND previous_score BETWEEN 0 AND 10", name: "grade_change_score_range"
    add_check_constraint :grade_change_requests, "resolver_id IS NULL OR resolver_id <> requester_id", name: "grade_change_separate_resolver"
    add_check_constraint :grade_change_requests, "(status = 'pending' AND resolver_id IS NULL AND resolved_at IS NULL) OR (status <> 'pending' AND resolver_id IS NOT NULL AND resolved_at IS NOT NULL)", name: "grade_change_resolution"
  end
end
