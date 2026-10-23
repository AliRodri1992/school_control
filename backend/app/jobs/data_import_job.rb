class DataImportJob < ApplicationJob
  queue_as :default

  def perform(id)
    batch = DataImport.find(id)
    batch.with_lock do
      return unless batch.status == "queued"
      batch.update!(status: "processing")
    end
    dataset = DataImportReader.new(batch).call
    validator = ValidateStudentImport.new(batch)
    validator.validate_mapping!(dataset.fetch(:headers), batch.mapping)
    imported = 0
    errors = []
    dataset.fetch(:rows).each do |line, values|
      begin
        attributes = validator.attributes(values, batch.mapping)
        Student.transaction do
          student = Student.create!(attributes)
          AuditEvent.create!(user: batch.user, action: "student.imported", record_type: "Student", record_id: student.id)
        end
        imported += 1
      rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique, ArgumentError => error
        errors << { row: line, messages: [ error.message ] }
      end
    end
    batch.update!(status: "completed", imported_rows: imported, total_rows: dataset.fetch(:rows).length, row_errors: errors.first(500))
  rescue StandardError => error
    batch&.update_columns(status: "failed", row_errors: [ { row: 0, messages: [ error.class.name ] } ], updated_at: Time.current)
    raise
  end
end
