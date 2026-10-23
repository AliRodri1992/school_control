module Api
  class ReportsController < ApplicationController
    def index
      kinds = SchoolReport::TYPES.filter_map do |kind, (title, _)|
        formats = %w[preview xlsx pdf].select { |format| current_user.can?("report_#{kind}.#{format}") }
        { kind: kind, title: title, formats: formats } if formats.any?
      end
      render json: { reports: kinds }
    end

    def preview
      report = SchoolReport.new(user: current_user, kind: params[:kind], action: "preview", filters: filters)
      page = [ params.fetch(:page, 1).to_i, 1 ].max
      render json: { title: report.title, headers: report.headers, rows: report.rows(limit: 100, offset: (page - 1) * 100), total: report.relation.count, page: page }
    end

    def create
      SchoolReport.new(user: current_user, kind: params[:kind], action: params[:file_format], filters: filters)
      export = ReportExport.create!(user: current_user, kind: params[:kind], file_format: params[:file_format], filters: filters, expires_at: 24.hours.from_now)
      ReportExportJob.perform_later(export.id)
      render json: export.as_json(only: %i[id status expires_at]), status: :accepted
    end

    def show
      export = ReportExport.where(user: current_user).find(params[:id])
      render json: export.as_json(only: %i[id kind file_format status expires_at error_message]).merge(downloadable: export.downloadable?)
    end

    def download
      export = ReportExport.where(user: current_user).find(params[:id])
      return head :forbidden unless export.downloadable?
      audit(export, "report.downloaded")
      response.headers["Cache-Control"] = "private, no-store"
      send_data export.file.download, type: export.file.content_type, filename: export.file.filename.to_s, disposition: "attachment"
    end

    private

    def permission_key
      case action_name
      when "preview" then "report_#{params[:kind]}.preview"
      when "create" then "report_#{params[:kind]}.#{params[:file_format]}"
      else "reports.index"
      end
    end

    def filters
      params.permit(:academic_year_id, :group_id, :student_id, :course_id, :term, :from, :to).to_h.compact_blank
    end
  end
end
