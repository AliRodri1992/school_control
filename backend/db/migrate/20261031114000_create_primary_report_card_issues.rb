class CreatePrimaryReportCardIssues < ActiveRecord::Migration[8.1]
  def change
    create_table :primary_report_card_issues do |t|
      t.references :enrollment, null: false, foreign_key: true
      t.references :issued_by, null: false, foreign_key: { to_table: :users }
      t.integer :term, null: false, default: 0
      t.integer :version, null: false
      t.string :rule_version, null: false
      t.string :sha256, null: false
      t.jsonb :snapshot, null: false, default: {}
      t.timestamps
    end
    add_index :primary_report_card_issues, %i[enrollment_id term version],
      unique: true, name: "idx_primary_report_card_issue_version"
    add_check_constraint :primary_report_card_issues, "term BETWEEN 0 AND 3 AND version > 0",
      name: "primary_report_card_issues_valid_version"
  end
end
