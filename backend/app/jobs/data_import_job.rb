class DataImportJob < ApplicationJob
  queue_as :default

  def perform(id)
    batch = DataImport.find(id)
    batch.with_lock do
      return unless batch.status == "queued"
      batch.update!(status: "processing")
    end
    dataset = DataImportReader.new(batch).call
    validator = case batch.kind
    when "students" then ValidateStudentImport.new(batch)
    when "teachers", "tutors" then ValidateUserImport.new(batch)
    when "grades" then ValidateGradeImport.new(batch)
    else ValidateCatalogImport.new(batch)
    end
    validator.validate_mapping!(dataset.fetch(:headers), batch.mapping)
    imported = batch.data_import_items.count
    errors = []
    dataset.fetch(:rows).each do |line, values|
      next if batch.data_import_items.exists?(row_number: line)
      begin
        attributes = validator.attributes(values, batch.mapping)
        model = batch.kind == "students" ? Student : validator.record_class
        if model == User
          raise ArgumentError, "Sin permiso para asignar usuarios" unless batch.user.can?("users.create") &&
            batch.user.can?("access_roles.assign")
          grants = PermissionCatalog.defaults(attributes.fetch(:role)).map do |key, scope|
            { key: key, data_scope: scope }
          end
          ManageAccess.verify_grants!(batch.user, grants)
        end
        imported_record = nil
        ActiveRecord::Base.transaction do
          imported_record = model.create!(attributes)
          batch.data_import_items.create!(row_number: line, record_type: model.name, record_id: imported_record.id)
          AuditEvent.create!(user: batch.user, action: "#{batch.kind.singularize}.imported", record_type: model.name, record_id: imported_record.id)
        end
        PasswordRecoveryJob.perform_later(imported_record.id, imported_record.session_version) if model == User
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
