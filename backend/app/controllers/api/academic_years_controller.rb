module Api
  class AcademicYearsController < CatalogController
    before_action :require_admin, only: %i[show destroy pdf]
    after_action :verify_authorized, only: %i[show destroy pdf]

    def index
      super
    end

    def create
      record = AcademicYear.new(attributes)
      record.status = "draft"
      authorize record, :create?
      record.save!
      audit(record, "AcademicYear.created")
      AcademicYearLifecycle.advance!(record, trigger: "created")
      render json: present(record.reload), status: :created
    end

    def update
      record = AcademicYear.find(params[:id])
      authorize record, :update?
      record.with_lock do
        raise ArgumentError, "Un ciclo cerrado o archivado no admite edición ordinaria" if record.closed_for_academics?
        record.update!(attributes)
        audit(record, "AcademicYear.updated")
      end
      AcademicYearLifecycle.advance!(record, trigger: "updated")
      render json: present(record.reload)
    end

    def show
      record = AcademicYear.find(params[:id])
      authorize record, :show?
      render json: present(record).merge(lifecycle: AcademicYearLifecycle.preview(record), calendar_events: record.calendar_events.order(:starts_at).map { |event| present(event) })
    end

    def destroy
      record = AcademicYear.find(params[:id])
      authorize record, :destroy?
      raise ArgumentError, "Un ciclo cerrado o archivado debe conservarse como historial académico" if record.closed_for_academics?
      if record.destroy
        audit(record, "AcademicYear.deleted")
        head :no_content
      else
        render json: { error: "No se puede eliminar un ciclo con información vinculada.", errors: record.errors.to_hash }, status: :conflict
      end
    end

    def pdf
      record = AcademicYear.find(params[:id])
      authorize record, :pdf?
      bytes = AcademicYearPdf.new(record).render
      audit(record, "AcademicYear.pdf")
      response.headers["Cache-Control"] = "private, no-store"
      send_data bytes, type: "application/pdf", filename: "ciclo-escolar-#{record.id}.pdf", disposition: "attachment"
    end

    private

    def model = AcademicYear
    def index_order = [ { starts_on: :desc } ]
    def attributes
      params.permit(
        :name, :starts_on, :ends_on, :admissions_open_on, :admissions_close_on,
        :reenrollment_open_on, :reenrollment_close_on, :administrative_closes_on, :archive_on, :calendar_source,
        :calendar_source_url, :calendar_source_reference, :calendar_published_on,
        :planned_school_days, :notes,
        *AcademicYear::EVALUATION_PERIODS.flat_map do |prefix|
          [ :"#{prefix}_term_starts_on", :"#{prefix}_term_ends_on", :"#{prefix}_term_capture_opens_on",
            :"#{prefix}_term_capture_closes_on", :"#{prefix}_term_review_on", :"#{prefix}_term_reports_on" ]
        end
      )
    end
  end
end
