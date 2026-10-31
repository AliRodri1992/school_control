class AddAcademicYearLifecycle < ActiveRecord::Migration[8.1]
  def up
    add_column :academic_years, :administrative_closes_on, :date
    add_column :academic_years, :archive_on, :date
    add_column :academic_years, :status_changed_at, :datetime
    change_column_default :academic_years, :status, from: "active", to: "draft"

    # Legacy rows previously defaulted to active. Normalize them before imposing
    # the single-school active-cycle constraint.
    execute <<~SQL
      UPDATE academic_years SET status = 'draft'
      WHERE status = 'active' AND starts_on > CURRENT_DATE;
      UPDATE academic_years SET status = 'closing'
      WHERE status = 'active' AND ends_on < CURRENT_DATE;
      WITH ranked AS (
        SELECT id, row_number() OVER (ORDER BY starts_on DESC, id DESC) AS position
        FROM academic_years WHERE status = 'active'
      )
      UPDATE academic_years SET status = 'closing'
      WHERE id IN (SELECT id FROM ranked WHERE position > 1);
    SQL
    add_index :academic_years, :status, unique: true, where: "status = 'active'",
              name: "index_academic_years_one_active"
    add_check_constraint :academic_years,
      "(administrative_closes_on IS NULL OR administrative_closes_on >= ends_on) AND " \
      "(archive_on IS NULL OR archive_on >= COALESCE(administrative_closes_on, ends_on))",
      name: "academic_year_lifecycle_dates_ordered"

    create_table :academic_year_status_transitions do |t|
      t.references :academic_year, null: false, foreign_key: true
      t.string :from_status, null: false
      t.string :to_status, null: false
      t.string :trigger, null: false, default: "automatic"
      t.text :reason, null: false
      t.jsonb :checks, null: false, default: {}
      t.datetime :occurred_at, null: false
      t.timestamps
    end
    add_index :academic_year_status_transitions, [ :academic_year_id, :occurred_at ],
              name: "idx_academic_year_transitions_timeline"
  end

  def down
    drop_table :academic_year_status_transitions
    remove_check_constraint :academic_years, name: "academic_year_lifecycle_dates_ordered"
    remove_index :academic_years, name: "index_academic_years_one_active"
    change_column_default :academic_years, :status, from: "draft", to: "active"
    remove_column :academic_years, :status_changed_at
    remove_column :academic_years, :archive_on
    remove_column :academic_years, :administrative_closes_on
  end
end
