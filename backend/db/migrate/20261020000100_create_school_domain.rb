class CreateSchoolDomain < ActiveRecord::Migration[8.1]
  def change
    create_table :schools do |t|
      t.string :name, null: false
      t.string :code
      t.string :address
      t.string :phone
      t.timestamps
    end
    create_table :users do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :role, null: false, default: "guardian"
      t.boolean :active, null: false, default: true
      t.timestamps
    end
    add_index :users, "lower(email)", unique: true
    add_check_constraint :users, "role IN ('admin','teacher','guardian','student')"
    create_table :academic_years do |t|
      t.string :name, null: false
      t.date :starts_on, null: false
      t.date :ends_on, null: false
      t.date :admissions_open_on, null: false
      t.date :admissions_close_on, null: false
      t.date :reenrollment_open_on, null: false
      t.date :reenrollment_close_on, null: false
      t.timestamps
    end
    add_index :academic_years, :name, unique: true
    add_check_constraint :academic_years, "starts_on < ends_on AND admissions_open_on <= admissions_close_on AND reenrollment_open_on <= reenrollment_close_on"
    create_table :groups do |t|
      t.references :academic_year, null: false, foreign_key: true
      t.integer :grade_level, null: false
      t.string :section, null: false
      t.integer :capacity, null: false, default: 30
      t.timestamps
    end
    add_index :groups, [ :academic_year_id, :grade_level, :section ], unique: true
    add_check_constraint :groups, "grade_level BETWEEN 1 AND 6 AND section IN ('A','B') AND capacity > 0"
    create_table :students do |t|
      t.references :guardian, null: false, foreign_key: { to_table: :users }
      t.references :user, foreign_key: true, index: { unique: true }
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :curp, null: false
      t.date :birth_date, null: false
      t.string :emergency_phone
      t.string :address
      t.timestamps
    end
    add_index :students, :curp, unique: true
    create_table :admissions do |t|
      t.references :student, null: false, foreign_key: true
      t.references :academic_year, null: false, foreign_key: true
      t.integer :grade_level, null: false
      t.string :kind, null: false
      t.string :status, null: false, default: "submitted"
      t.string :folio, null: false
      t.text :reason
      t.timestamps
    end
    add_index :admissions, [ :student_id, :academic_year_id ], unique: true
    add_index :admissions, :folio, unique: true
    add_check_constraint :admissions, "grade_level BETWEEN 1 AND 6 AND kind IN ('new','reenrollment') AND status IN ('submitted','approved','rejected')"
    create_table :enrollments do |t|
      t.references :student, null: false, foreign_key: true
      t.references :academic_year, null: false, foreign_key: true
      t.references :group, null: false, foreign_key: true
      t.references :admission, null: false, foreign_key: true, index: { unique: true }
      t.string :status, null: false, default: "active"
      t.string :outcome
      t.timestamps
    end
    add_index :enrollments, [ :student_id, :academic_year_id ], unique: true
    add_check_constraint :enrollments, "status IN ('active','completed') AND (outcome IS NULL OR outcome IN ('promoted','repeat','graduated'))"
    create_table :subjects do |t|
      t.string :name, null: false
      t.string :code, null: false
      t.timestamps
    end
    add_index :subjects, :code, unique: true
    create_table :courses do |t|
      t.references :group, null: false, foreign_key: true
      t.references :subject, null: false, foreign_key: true
      t.references :teacher, null: false, foreign_key: { to_table: :users }
      t.integer :weekly_periods, null: false, default: 3
      t.timestamps
    end
    add_index :courses, [ :group_id, :subject_id ], unique: true
    add_check_constraint :courses, "weekly_periods BETWEEN 1 AND 20"
    create_table :schedule_slots do |t|
      t.references :course, null: false, foreign_key: true
      t.integer :weekday, null: false
      t.integer :starts_minute, null: false
      t.integer :ends_minute, null: false
      t.string :room, null: false
      t.timestamps
    end
    add_check_constraint :schedule_slots, "weekday BETWEEN 1 AND 5 AND starts_minute >= 420 AND ends_minute <= 1200 AND starts_minute < ends_minute"
    create_table :attendances do |t|
      t.references :enrollment, null: false, foreign_key: true
      t.date :on, null: false
      t.string :status, null: false
      t.text :notes
      t.timestamps
    end
    add_index :attendances, [ :enrollment_id, :on ], unique: true
    add_check_constraint :attendances, "status IN ('present','absent','late','justified')"
    create_table :grades do |t|
      t.references :enrollment, null: false, foreign_key: true
      t.references :course, null: false, foreign_key: true
      t.integer :term, null: false
      t.decimal :score, precision: 4, scale: 2, null: false
      t.text :feedback
      t.timestamps
    end
    add_index :grades, [ :enrollment_id, :course_id, :term ], unique: true
    add_check_constraint :grades, "term BETWEEN 1 AND 3 AND score BETWEEN 0 AND 10"
    create_table :calendar_events do |t|
      t.references :academic_year, null: false, foreign_key: true
      t.references :group, foreign_key: true
      t.string :title, null: false
      t.string :kind, null: false, default: "exam"
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.text :description
      t.timestamps
    end
    add_check_constraint :calendar_events, "starts_at < ends_at AND kind IN ('exam','holiday','meeting','activity')"
    create_table :announcements do |t|
      t.string :title, null: false
      t.text :body, null: false
      t.string :audience, null: false, default: "all"
      t.timestamps
    end
    add_check_constraint :announcements, "audience IN ('all','guardian','teacher','student')"
    create_table :audit_events do |t|
      t.references :user, foreign_key: true
      t.string :action, null: false
      t.string :record_type, null: false
      t.bigint :record_id, null: false
      t.jsonb :changes_summary, null: false, default: {}
      t.timestamps
    end
  end
end
