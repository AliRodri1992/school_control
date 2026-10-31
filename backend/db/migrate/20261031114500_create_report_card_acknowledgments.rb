class CreateReportCardAcknowledgments < ActiveRecord::Migration[8.1]
  def change
    create_table :report_card_acknowledgments do |t|
      t.references :primary_report_card_issue, null: false, foreign_key: true,
        index: { name: "idx_report_card_acknowledgments_issue" }
      t.references :guardian, null: false, foreign_key: { to_table: :users }
      t.datetime :acknowledged_at, null: false
      t.timestamps
    end
    add_index :report_card_acknowledgments, %i[primary_report_card_issue_id guardian_id],
      unique: true, name: "idx_report_card_acknowledgments_unique_guardian"
  end
end
