# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_10_21_190000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "academic_years", force: :cascade do |t|
    t.string "name", null: false
    t.date "starts_on", null: false
    t.date "ends_on", null: false
    t.date "admissions_open_on", null: false
    t.date "admissions_close_on", null: false
    t.date "reenrollment_open_on", null: false
    t.date "reenrollment_close_on", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_academic_years_on_name", unique: true
    t.check_constraint "starts_on < ends_on AND admissions_open_on <= admissions_close_on AND reenrollment_open_on <= reenrollment_close_on"
  end

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "admissions", force: :cascade do |t|
    t.bigint "student_id", null: false
    t.bigint "academic_year_id", null: false
    t.integer "grade_level", null: false
    t.string "kind", null: false
    t.string "status", default: "submitted", null: false
    t.string "folio", null: false
    t.text "reason"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["academic_year_id"], name: "index_admissions_on_academic_year_id"
    t.index ["folio"], name: "index_admissions_on_folio", unique: true
    t.index ["student_id", "academic_year_id"], name: "index_admissions_on_student_id_and_academic_year_id", unique: true
    t.index ["student_id"], name: "index_admissions_on_student_id"
    t.check_constraint "grade_level >= 1 AND grade_level <= 6 AND (kind::text = ANY (ARRAY['new'::character varying::text, 'reenrollment'::character varying::text])) AND (status::text = ANY (ARRAY['submitted'::character varying::text, 'approved'::character varying::text, 'rejected'::character varying::text]))"
  end

  create_table "announcements", force: :cascade do |t|
    t.string "title", null: false
    t.text "body", null: false
    t.string "audience", default: "all", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.check_constraint "audience::text = ANY (ARRAY['all'::character varying::text, 'guardian'::character varying::text, 'teacher'::character varying::text, 'student'::character varying::text])"
  end

  create_table "attendances", force: :cascade do |t|
    t.bigint "enrollment_id", null: false
    t.date "on", null: false
    t.string "status", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["enrollment_id", "on"], name: "index_attendances_on_enrollment_id_and_on", unique: true
    t.index ["enrollment_id"], name: "index_attendances_on_enrollment_id"
    t.check_constraint "status::text = ANY (ARRAY['present'::character varying::text, 'absent'::character varying::text, 'late'::character varying::text, 'justified'::character varying::text])"
  end

  create_table "audit_events", force: :cascade do |t|
    t.bigint "user_id"
    t.string "action", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.jsonb "changes_summary", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_audit_events_on_user_id"
  end

  create_table "calendar_events", force: :cascade do |t|
    t.bigint "academic_year_id", null: false
    t.bigint "group_id"
    t.string "title", null: false
    t.string "kind", default: "exam", null: false
    t.datetime "starts_at", null: false
    t.datetime "ends_at", null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["academic_year_id"], name: "index_calendar_events_on_academic_year_id"
    t.index ["group_id"], name: "index_calendar_events_on_group_id"
    t.check_constraint "starts_at < ends_at AND (kind::text = ANY (ARRAY['exam'::character varying::text, 'holiday'::character varying::text, 'meeting'::character varying::text, 'activity'::character varying::text]))"
  end

  create_table "courses", force: :cascade do |t|
    t.bigint "group_id", null: false
    t.bigint "subject_id", null: false
    t.bigint "teacher_id", null: false
    t.integer "weekly_periods", default: 3, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["group_id", "subject_id"], name: "index_courses_on_group_id_and_subject_id", unique: true
    t.index ["group_id"], name: "index_courses_on_group_id"
    t.index ["subject_id"], name: "index_courses_on_subject_id"
    t.index ["teacher_id"], name: "index_courses_on_teacher_id"
    t.check_constraint "weekly_periods >= 1 AND weekly_periods <= 20"
  end

  create_table "dashboard_preferences", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.jsonb "configuration", default: {}, null: false
    t.integer "lock_version", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_dashboard_preferences_on_user_id", unique: true
  end

  create_table "enrollments", force: :cascade do |t|
    t.bigint "student_id", null: false
    t.bigint "academic_year_id", null: false
    t.bigint "group_id", null: false
    t.bigint "admission_id", null: false
    t.string "status", default: "active", null: false
    t.string "outcome"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["academic_year_id"], name: "index_enrollments_on_academic_year_id"
    t.index ["admission_id"], name: "index_enrollments_on_admission_id", unique: true
    t.index ["group_id"], name: "index_enrollments_on_group_id"
    t.index ["student_id", "academic_year_id"], name: "index_enrollments_on_student_id_and_academic_year_id", unique: true
    t.index ["student_id"], name: "index_enrollments_on_student_id"
    t.check_constraint "(status::text = ANY (ARRAY['active'::character varying::text, 'completed'::character varying::text])) AND (outcome IS NULL OR (outcome::text = ANY (ARRAY['promoted'::character varying::text, 'repeat'::character varying::text, 'graduated'::character varying::text])))"
  end

  create_table "grades", force: :cascade do |t|
    t.bigint "enrollment_id", null: false
    t.bigint "course_id", null: false
    t.integer "term", null: false
    t.decimal "score", precision: 4, scale: 2, null: false
    t.text "feedback"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_grades_on_course_id"
    t.index ["enrollment_id", "course_id", "term"], name: "index_grades_on_enrollment_id_and_course_id_and_term", unique: true
    t.index ["enrollment_id"], name: "index_grades_on_enrollment_id"
    t.check_constraint "term >= 1 AND term <= 3 AND score >= 0::numeric AND score <= 10::numeric"
  end

  create_table "groups", force: :cascade do |t|
    t.bigint "academic_year_id", null: false
    t.integer "grade_level", null: false
    t.string "section", null: false
    t.integer "capacity", default: 30, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["academic_year_id", "grade_level", "section"], name: "index_groups_on_academic_year_id_and_grade_level_and_section", unique: true
    t.index ["academic_year_id"], name: "index_groups_on_academic_year_id"
    t.check_constraint "grade_level >= 1 AND grade_level <= 6 AND (section::text = ANY (ARRAY['A'::character varying::text, 'B'::character varying::text])) AND capacity > 0"
  end

  create_table "schedule_slots", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.integer "weekday", null: false
    t.integer "starts_minute", null: false
    t.integer "ends_minute", null: false
    t.string "room", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_schedule_slots_on_course_id"
    t.check_constraint "weekday >= 1 AND weekday <= 5 AND starts_minute >= 420 AND ends_minute <= 1200 AND starts_minute < ends_minute"
  end

  create_table "schools", force: :cascade do |t|
    t.string "name", null: false
    t.string "code"
    t.string "address"
    t.string "phone"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "students", force: :cascade do |t|
    t.bigint "guardian_id", null: false
    t.bigint "user_id"
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.string "curp", null: false
    t.date "birth_date", null: false
    t.string "emergency_phone"
    t.string "address"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["curp"], name: "index_students_on_curp", unique: true
    t.index ["guardian_id"], name: "index_students_on_guardian_id"
    t.index ["user_id"], name: "index_students_on_user_id", unique: true
  end

  create_table "subjects", force: :cascade do |t|
    t.string "name", null: false
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_subjects_on_code", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "role", default: "guardian", null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index "lower((email)::text)", name: "index_users_on_lower_email", unique: true
    t.check_constraint "role::text = ANY (ARRAY['admin'::character varying::text, 'teacher'::character varying::text, 'guardian'::character varying::text, 'student'::character varying::text])"
  end

  add_foreign_key "dashboard_preferences", "users"
  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "admissions", "academic_years"
  add_foreign_key "admissions", "students"
  add_foreign_key "attendances", "enrollments"
  add_foreign_key "audit_events", "users"
  add_foreign_key "calendar_events", "academic_years"
  add_foreign_key "calendar_events", "groups"
  add_foreign_key "courses", "groups"
  add_foreign_key "courses", "subjects"
  add_foreign_key "courses", "users", column: "teacher_id"
  add_foreign_key "enrollments", "academic_years"
  add_foreign_key "enrollments", "admissions"
  add_foreign_key "enrollments", "groups"
  add_foreign_key "enrollments", "students"
  add_foreign_key "grades", "courses"
  add_foreign_key "grades", "enrollments"
  add_foreign_key "groups", "academic_years"
  add_foreign_key "schedule_slots", "courses"
  add_foreign_key "students", "users"
  add_foreign_key "students", "users", column: "guardian_id"
end
