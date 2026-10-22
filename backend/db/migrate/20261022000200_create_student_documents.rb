class CreateStudentDocuments < ActiveRecord::Migration[8.1]
  def change
    create_table :student_documents do |t|
      t.references :student, null: false, foreign_key: true
      t.references :uploader, null: false, foreign_key: { to_table: :users }
      t.references :reviewer, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.string :status, null: false, default: "pending"
      t.text :review_notes
      t.datetime :reviewed_at
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end
    add_check_constraint :student_documents, "status IN ('pending', 'approved', 'correction_requested')", name: "student_documents_status"
  end
end
