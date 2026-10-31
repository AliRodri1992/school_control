class AddSepReportCardMetadata < ActiveRecord::Migration[8.1]
  def change
    add_column :schools, :federal_entity, :string
    add_column :schools, :shift, :string
    add_column :schools, :director_name, :string
    add_column :schools, :indigenous_language, :string
    add_column :schools, :issue_place, :string
    add_column :primary_report_card_issues, :layout, :string, null: false, default: "school"
    add_check_constraint :primary_report_card_issues, "layout IN ('school', 'sep_reference')",
      name: "primary_report_card_issues_layout"
  end
end
