require "caxlsx"
require "prawn"
require "prawn/table"

class RenderSchoolReport
  def self.call(report:, format:)
    rows = report.rows(limit: 10_001)
    raise ArgumentError, "El reporte supera 10 000 filas; ajusta los filtros" if rows.length > 10_000
    format == "xlsx" ? spreadsheet(report, rows) : pdf(report, rows)
  end

  def self.spreadsheet(report, rows)
    package = Axlsx::Package.new
    package.workbook.add_worksheet(name: "Reporte") do |sheet|
      heading = package.workbook.styles.add_style(bg_color: "185B52", fg_color: "FFFFFF", b: true)
      sheet.add_row report.headers, style: heading
      rows.each do |row|
        sheet.add_row row, types: row.map { |value| value.is_a?(Numeric) ? :float : :string }
      end
      sheet.auto_filter = "A1:#{Axlsx.col_ref(report.headers.length - 1)}#{rows.length + 1}"
      sheet.sheet_view.pane do |pane|
        pane.top_left_cell = "A2"
        pane.state = :frozen_split
        pane.y_split = 1
        pane.active_pane = :bottom_left
      end
    end
    package.workbook.add_worksheet(name: "Contexto") do |sheet|
      sheet.add_row [ "Escuela", School.first&.name.to_s ], types: [ :string, :string ]
      sheet.add_row [ "Reporte", report.title ], types: [ :string, :string ]
      sheet.add_row [ "Generado", Time.current.iso8601 ], types: [ :string, :string ]
      sheet.add_row [ "Filtros", report.filters.to_json ], types: [ :string, :string ]
      sheet.add_row [ "Filas", rows.length ]
      sheet.add_row [ "Alcance", "Consulta interna; no es certificación oficial. Ausencia de captura no equivale a cero ni a falta." ]
    end
    package.to_stream.read
  end

  def self.pdf(report, rows)
    document = Prawn::Document.new(page_size: "A4", page_layout: :landscape, margin: 35)
    document.font_families.update("School" => { normal: "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", bold: "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" })
    document.font "School"
    document.text School.first&.name.to_s, size: 18, style: :bold
    document.text report.title, size: 14
    document.text "Generado: #{Time.current.iso8601} · Filas: #{rows.length}", size: 8
    document.text "Filtros: #{report.filters.to_json}", size: 8
    document.move_down 12
    table = [ report.headers ] + rows.map { |row| row.map { |value| value.to_s.truncate(250) } }
    document.table(table, header: true, width: document.bounds.width, cell_style: { size: 8, padding: 5, overflow: :shrink_to_fit, min_font_size: 6 }) do |grid|
      grid.row(0).background_color = "185B52"
      grid.row(0).text_color = "FFFFFF"
      grid.row(0).font_style = :bold
    end
    document.move_down 10
    document.text "Consulta interna. Campos de más de 250 caracteres abreviados; Excel conserva el texto completo. Sin captura no equivale a cero ni a falta.", size: 7
    document.number_pages "Página <page> de <total>", at: [ 0, -15 ], size: 8
    document.render
  end
  private_class_method :spreadsheet, :pdf
end
