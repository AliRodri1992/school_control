require "prawn"

# Landscape school copy modelled on DGAIR's 2025-2026 primary autographic
# template. This service deliberately never fabricates SEP identifiers,
# signatures, state logos, official seals, certificate numbers or QR codes.
# It is a consultation template until issued and authenticated by the
# competent educational authority.
class SepPrimaryReportCardPdf
  REFERENCE = "DGAIR · FORMATO DE PRIMARIA 2025-2026".freeze
  DARK = "2B2C32".freeze
  GOLD = "DEC78E".freeze
  PALE = "F6F0DE".freeze
  FIELDS = [
    [ "Lenguajes", "languages" ],
    [ "Saberes y pensamiento\ncientífico", "science" ],
    [ "Ética, naturaleza\ny sociedades", "ethics" ],
    [ "De lo humano y\nlo comunitario", "community" ]
  ].freeze

  def initialize(data)
    @data = data.deep_symbolize_keys
  end

  def render
    pdf = Prawn::Document.new(page_size: "A4", page_layout: :landscape, margin: 25)
    pdf.font_families.update("School" => {
      normal: "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
      bold: "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    })
    pdf.font "School"
    @pdf = pdf
    @width = pdf.bounds.width
    @height = pdf.bounds.height
    header
    identity
    grades
    observations
    signatures
    pdf.render
  end

  private

  def label(value, x:, y:, width:, height: 16, size: 7, bold: false, align: :left, color: DARK)
    @pdf.fill_color color
    @pdf.text_box(value.to_s, at: [ x, y ], width: width, height: height, size: size,
      style: bold ? :bold : :normal, align: align, valign: :center,
      overflow: :shrink_to_fit, min_font_size: 5.0)
  end

  def frame(x, top, width, height, fill: nil, line: DARK)
    @pdf.fill_color fill if fill
    @pdf.fill_rectangle([ x, top ], width, height) if fill
    @pdf.stroke_color line
    @pdf.line_width 0.65
    @pdf.stroke_rectangle([ x, top ], width, height)
  end

  def header
    label("EDUCACIÓN", x: 0, y: @height, width: 190, height: 35, size: 19, bold: true, color: "752443")
    label("Secretaría de Educación Pública", x: 1, y: @height - 33, width: 187, size: 7)
    label("FORMATO DE CONSULTA", x: @width - 180, y: @height - 5, width: 180, size: 9,
      bold: true, align: :right, color: "752443")
    label("Entidad federativa: #{@data[:federal_entity].presence || 'Por registrar'}",
      x: @width - 230, y: @height - 30, width: 230, size: 7, align: :right)
    top = @height - 5
    label("SISTEMA EDUCATIVO NACIONAL", x: 198, y: top, width: 390, size: 13, bold: true, align: :center)
    label("BOLETA DE EVALUACIÓN", x: 198, y: top - 22, width: 390, size: 14, bold: true, align: :center)
    label("#{@data.fetch(:grade)}° GRADO DE EDUCACIÓN PRIMARIA  ·  CICLO ESCOLAR #{@data.fetch(:year_name)}",
      x: 190, y: top - 44, width: 405, size: 9, align: :center)
    label("Estructura visual de referencia: #{REFERENCE}", x: 0, y: @height - 70,
      width: @width, size: 7, color: "555E69", align: :center)
  end

  def identity
    label("NOMBRE(S) Y APELLIDOS: #{@data[:student_name]}", x: 0, y: @height - 90, width: @width * 0.68, bold: true)
    label("CURP: #{@data[:curp]}", x: @width * 0.69, y: @height - 90,
      width: @width * 0.31, bold: true)
    label("NOMBRE DE LA ESCUELA: #{@data[:school_name]}", x: 0, y: @height - 108,
      width: @width * 0.56)
    label("CCT: #{@data[:school_code].presence || '—'}", x: @width * 0.56, y: @height - 108, width: @width * 0.20)
    label("TURNO: #{@data[:shift].presence || '—'}", x: @width * 0.77, y: @height - 108,
      width: @width * 0.12)
    label("GRUPO: #{@data[:group]}", x: @width * 0.90, y: @height - 108,
      width: @width * 0.10)
  end

  def grades
    x = 0
    top = @height - 132
    total = @width * 0.60
    first = 78
    column = (total - first) / 4.0
    # The original national template has three partial periods and a final row.
    frame(x, top, first, 41, fill: GOLD)
    label("PERIODO DE\nEVALUACIÓN", x: x + 2, y: top - 4, width: first - 4,
      height: 32, size: 6.8, bold: true, align: :center)
    frame(first, top, total - first, 16, fill: GOLD)
    label("CAMPOS FORMATIVOS", x: first, y: top - 1, width: total - first, height: 14,
      bold: true, align: :center, size: 7.5)
    FIELDS.each_with_index do |(name, _), i|
      frame(first + i * column, top - 16, column, 25, fill: GOLD)
      label(name, x: first + i * column + 2, y: top - 18,
        width: column - 4, height: 21, size: 6.1, align: :center, bold: true)
    end
    terms = [ "1.er", "2.º", "3.er", "PROMEDIO\nFINAL" ]
    terms.each_with_index do |term_name, row|
      y = top - 41 - row * 21
      frame(x, y, first, 21, fill: row == 3 ? PALE : nil)
      label(term_name, x: x + 2, y: y - 1, width: first - 4, height: 19,
        size: 7, bold: row == 3, align: :center)
      FIELDS.each_with_index do |(_, code), index|
        field = @data.fetch(:fields).find { |item| item[:code] == code } || {}
        score = row == 3 ? field[:final] : field.fetch(:terms, [])[row]
        value = score.nil? || (@data[:term].positive? && row >= @data[:term]) ? "" : score.to_s
        frame(first + index * column, y, column, 21, fill: row == 3 ? PALE : nil)
        label(value, x: first + index * column, y: y, width: column,
          height: 21, size: 10, bold: row == 3, align: :center)
      end
    end

    side = total + 20
    width = @width - side
    info_box(side, top, width, "LENGUA INDÍGENA", @data[:indigenous_language])
    if @data.fetch(:grade) > 1
      status = @data[:outcome]
      info_box(side, top - 31, width / 2 - 5, "PROMOVIDA(O)",
        %w[promoted graduated].include?(status) ? "Sí" : nil)
      info_box(side + width / 2 + 5, top - 31, width / 2 - 5, "NO PROMOVIDA(O)",
        status == "repeat" ? "Sí" : nil)
    end
    info_box(side, top - 63, width / 2 - 5, "PROMEDIO FINAL\nDE GRADO", @data[:annual_average])
    attendance = @data.fetch(:attendance, {})
    days = attendance.fetch("present", 0).to_i + attendance.fetch("late", 0).to_i
    info_box(side + width / 2 + 5, top - 63, width / 2 - 5, "ASISTENCIAS", days)
    info_box(side, top - 95, width, "FOLIO OFICIAL", "PENDIENTE DE AUTORIDAD")
  end

  def info_box(x, top, width, name, value)
    frame(x, top, width, 25)
    label(name, x: x + 2, y: top - 1, width: width * 0.44 - 4,
      height: 23, size: 6.1, bold: true, align: :center)
    @pdf.fill_color GOLD
    @pdf.fill_rectangle([ x + 0.6, top - 0.6 ], width * 0.44, 23.8)
    label(name, x: x + 2, y: top - 1, width: width * 0.44 - 4,
      height: 23, size: 6.0, bold: true, align: :center)
    label(value, x: x + width * 0.44 + 3, y: top - 1,
      width: width * 0.56 - 6, height: 23, size: 7.3, align: :center)
  end

  def observations
    top = @height - 280
    first = 44
    second = 146
    third = @width - first - second
    header_height = 20
    frame(0, top, first, header_height, fill: GOLD)
    frame(first, top, second, header_height, fill: GOLD)
    frame(first + second, top, third, header_height, fill: GOLD)
    label("PERIODO", x: 0, y: top, width: first, height: header_height, size: 6, align: :center, bold: true)
    label("CAMPOS FORMATIVOS", x: first, y: top, width: second, height: header_height,
      size: 7, align: :center, bold: true)
    label("OBSERVACIONES Y SUGERENCIAS SOBRE LOS APRENDIZAJES",
      x: first + second, y: top, width: third, height: header_height,
      size: 7, align: :center, bold: true)
    3.times do |term|
      period_top = top - header_height - term * 37.5
      frame(0, period_top, first, 37.5, fill: PALE)
      label("#{term + 1}.er", x: 0, y: period_top, width: first, height: 37.5,
        size: 7, align: :center, bold: true)
      FIELDS.each_with_index do |(name, code), row|
        y = period_top - row * 9.375
        fill = row.odd? ? "F9F9F9" : nil
        frame(first, y, second, 9.375, fill: fill)
        frame(first + second, y, third, 9.375, fill: fill)
        field = @data.fetch(:fields).find { |item| item[:code] == code } || {}
        note = field.fetch(:observations, [])[term].to_s
        note = "" if @data[:term].positive? && term >= @data[:term]
        label(name.tr("\n", " "), x: first + 3, y: y, width: second - 6,
          height: 9, size: 5.6)
        label(note, x: first + second + 4, y: y, width: third - 8,
          height: 9, size: 5.8)
      end
    end
  end

  def signatures
    top = @height - 426
    label("DOCENTE RESPONSABLE: #{@data[:teacher_name].presence || '________________________'}",
      x: 0, y: top, width: @width * 0.61, height: 15, size: 7)
    label("DIRECCIÓN: #{@data[:director_name].presence || '________________________'}",
      x: 0, y: top - 17, width: @width * 0.61, height: 15, size: 7)
    label("LUGAR Y FECHA: #{@data[:issue_place].presence || 'Por registrar'} · #{@data[:issued_on]}",
      x: 0, y: top - 34, width: @width * 0.61, height: 15, size: 7)
    x = @width * 0.64
    width = @width - x
    frame(x, top, width, 15, fill: GOLD)
    label("FIRMA DE MADRE, PADRE O PERSONA TUTORA", x: x, y: top,
      width: width, height: 15, size: 7, bold: true, align: :center)
    3.times do |term|
      left = x + term * width / 3.0
      frame(left, top - 15, width / 3.0, 45)
      label("Periodo #{term + 1}", x: left + 3, y: top - 17,
        width: width / 3.0 - 6, size: 6)
    end
    label("FORMATO REFERENCIAL DE CONSULTA · SIN FIRMA, FOLIO O SELLO OFICIAL SEP",
      x: 0, y: 16, width: @width, height: 10, size: 7, bold: true,
      align: :center, color: "9A2446")
    label("Referencia de diseño: dgair.sep.gob.mx · boleta primaria con firma autógrafa 2025-2026",
      x: 0, y: 6, width: @width, height: 9, size: 5.6, align: :center)
  end
end
