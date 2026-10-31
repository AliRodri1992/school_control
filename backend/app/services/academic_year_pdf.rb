class AcademicYearPdf
  def initialize(year)
    @year = year
  end

  def render
    pdf = Prawn::Document.new(page_size: "A4", margin: 42)
    pdf.text "SCHOOL CONTROL", size: 10, color: "3555A0", style: :bold
    pdf.move_down 10
    pdf.text "Ficha del ciclo escolar #{@year.name}", size: 19, style: :bold
    pdf.move_down 6
    pdf.text "Resumen académico y calendario registrado", size: 10, color: "64748B"
    pdf.move_down 20
    section(pdf, "Datos generales", [
      [ "Estado", @year.status ],
      [ "Inicio de clases", date(@year.starts_on) ],
      [ "Fin de clases", date(@year.ends_on) ],
      [ "Días lectivos previstos", @year.planned_school_days || "Sin especificar" ],
      [ "Origen del calendario", @year.calendar_source ],
      [ "Referencia", @year.calendar_source_reference.presence || "Sin registrar" ],
      [ "Publicación de la fuente", date(@year.calendar_published_on) ],
      [ "URL de referencia", @year.calendar_source_url.presence || "Sin registrar" ]
    ])
    section(pdf, "Convocatorias", [
      [ "Nuevo ingreso", "#{date(@year.admissions_open_on)} a #{date(@year.admissions_close_on)}" ],
      [ "Reinscripción", "#{date(@year.reenrollment_open_on)} a #{date(@year.reenrollment_close_on)}" ]
    ])
    AcademicYear::EVALUATION_PERIODS.each_with_index do |prefix, index|
      section(pdf, "Trimestre #{index + 1}", [
        [ "Periodo", "#{date(@year.public_send("#{prefix}_term_starts_on"))} a #{date(@year.public_send("#{prefix}_term_ends_on"))}" ],
        [ "Captura", "#{date(@year.public_send("#{prefix}_term_capture_opens_on"))} a #{date(@year.public_send("#{prefix}_term_capture_closes_on"))}" ],
        [ "Validación", date(@year.public_send("#{prefix}_term_review_on")) ],
        [ "Comunicación de resultados", date(@year.public_send("#{prefix}_term_reports_on")) ]
      ])
    end
    events = @year.calendar_events.order(:starts_at)
    section(pdf, "Eventos y suspensiones (#{events.count})", events.map { |event| [ "#{date(event.starts_at)} · #{event.kind}", event.title ] }.first(80))
    pdf.move_down 12
    pdf.text "Notas: #{@year.notes}", size: 9 if @year.notes.present?
    pdf.number_pages "Página <page> de <total>", at: [ pdf.bounds.right - 90, 0 ], width: 90, align: :right, size: 8
    pdf.render
  end

  private

  def section(pdf, title, rows)
    pdf.start_new_page if pdf.cursor < 105
    pdf.text title, size: 12, style: :bold, color: "26365D"
    pdf.move_down 7
    rows.each do |label, value|
      pdf.start_new_page if pdf.cursor < 45
      pdf.text "#{label}: #{value}", size: 9
      pdf.move_down 5
    end
    pdf.move_down 12
  end

  def date(value) = value&.strftime("%d/%m/%Y") || "Sin registrar"
end
