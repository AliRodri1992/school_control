class AddPrimaryGradingRulesAndClosureAudit < ActiveRecord::Migration[8.1]
  def change
    add_column :academic_years, :grading_rule_version, :string, default: "sep_10_09_23_v1", null: false
    add_column :academic_years, :average_decimal_mode, :string, default: "truncate", null: false
    add_column :academic_years, :grading_rule_reference, :string
    add_check_constraint :academic_years, "average_decimal_mode IN ('truncate', 'round_half_up')",
      name: "academic_years_average_decimal_mode"
    add_column :enrollments, :promotion_authorized_by_id, :bigint
    add_column :enrollments, :promotion_authorized_at, :datetime
    add_column :enrollments, :promotion_exception_reason, :text
    add_foreign_key :enrollments, :users, column: :promotion_authorized_by_id
  end
end
