class AddEvaluationPeriodsToAcademicYears < ActiveRecord::Migration[8.1]
  def change
    add_column :academic_years, :first_term_starts_on, :date
    add_column :academic_years, :first_term_ends_on, :date
    add_column :academic_years, :second_term_starts_on, :date
    add_column :academic_years, :second_term_ends_on, :date
    add_column :academic_years, :third_term_starts_on, :date
    add_column :academic_years, :third_term_ends_on, :date
    add_check_constraint :academic_years, "(first_term_starts_on IS NULL OR first_term_ends_on IS NULL OR first_term_starts_on <= first_term_ends_on) AND (second_term_starts_on IS NULL OR second_term_ends_on IS NULL OR second_term_starts_on <= second_term_ends_on) AND (third_term_starts_on IS NULL OR third_term_ends_on IS NULL OR third_term_starts_on <= third_term_ends_on)", name: "academic_year_evaluation_period_ranges"
  end
end
