class ReportExportJob < ApplicationJob
  queue_as :default

  def perform(export_id)
    export = ReportExport.find(export_id)
    export.with_lock do
      return unless export.status == "queued"
      raise ArgumentError, "El reporte expiró" unless export.expires_at.future?
      report = export.report
      fingerprint = report.fingerprint
      bytes = RenderSchoolReport.call(report: report, format: export.file_format)
      raise ArgumentError, "Tus permisos cambiaron; solicita un reporte nuevo" unless export.report.fingerprint == fingerprint
      export.file.attach(io: StringIO.new(bytes), filename: "#{export.kind}-#{export.id}.#{export.file_format}",
        content_type: export.file_format == "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      export.update!(status: "ready", access_fingerprint: fingerprint)
      AuditEvent.create!(user: export.user, action: "report.generated", record_type: "ReportExport", record_id: export.id)
    end
  rescue ArgumentError => error
    export&.update!(status: "failed", error_message: error.message)
  end
end
