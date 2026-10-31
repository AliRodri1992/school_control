require "prawn"
require "prawn/table"

# School-issued CONSULTATION PDF, not the SEP's signed/certified national form.
class PrimaryReportCardPdf
  def initialize(enrollment:, term: 0, layout: "school")
    @enrollment = enrollment
    @term = Integer(term)
    raise ArgumentError, "Trimestre inválido" unless (0..3).cover?(@term)
    @layout = layout
    raise ArgumentError, "Formato de boleta inválido" unless %w[school sep_reference].include?(@layout)
  end

  def snapshot
    summary = PrimarySchoolGrading.report(enrollment: @enrollment)
    fields = summary.fetch(:fields)
    if @term.zero?
      raise ArgumentError, "No es posible emitir la boleta final con evaluaciones incompletas" unless summary[:complete]
    elsif fields.any? { |field| field[:terms][@term - 1].nil? }
      raise ArgumentError, "Faltan calificaciones publicadas del trimestre solicitado"
    end
    school = School.first
    {
      student_name: @enrollment.student.full_name,
      curp: @enrollment.student.curp,
      school_name: school&.name.presence || "Escuela sin configurar",
      school_code: school&.code, federal_entity: school&.federal_entity,
      shift: school&.shift, director_name: school&.director_name,
      indigenous_language: school&.indigenous_language, issue_place: school&.issue_place,
      layout: @layout, layout_reference: @layout == "sep_reference" ? "DGAIR SEP primaria 2025-2026" : nil,
      year_name: @enrollment.academic_year.name,
      grade: @enrollment.group.grade_level, group: @enrollment.group.label,
      term: @term, fields: fields, annual_average: summary[:annual_average],
      accredited: summary[:accredited], recommendation: summary[:recommendation],
      outcome: @enrollment.outcome, rule_version: summary[:rule_version],
      decimal_mode: summary[:average_decimal_mode],
      attendance: @enrollment.attendances.group(:status).count,
      issued_on: Date.current.iso8601,
      teacher_name: @enrollment.group.courses.includes(:teacher).first&.teacher&.name
    }
  end

  def render(data = snapshot)
    return SepPrimaryReportCardPdf.new(data).render if @layout == "sep_reference"
    pdf = Prawn::Document.new(page_size: "A4", margin: 35)
    pdf.font_families.update("School" => {
      normal: "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
      bold: "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    })
    pdf.font "School"
    pdf.text data[:school_name].to_s, size: 14, style: :bold, align: :center
    pdf.move_down 5
    pdf.text "BOLETA ESCOLAR DE CONSULTA · NO ES DOCUMENTO OFICIAL CERTIFICADO",
      size: 8, color: "58677D", align: :center
    pdf.move_down 14
    pdf.text "Alumno: #{data[:student_name]}", size: 10, style: :bold
    pdf.text "CURP: #{data[:curp]} · CCT: #{data[:school_code].presence || 'Sin registrar'}", size: 8
    pdf.text "Ciclo: #{data[:year_name]} · Grado: #{data[:grade]}° · Grupo: #{data[:group]}", size: 9
    pdf.text "Docente: #{data[:teacher_name].presence || 'Sin asignar'}", size: 8
    pdf.text(data[:term].zero? ? "RESULTADOS DEL CICLO ESCOLAR" : "RESULTADOS DEL TRIMESTRE #{data[:term]}",
      size: 12, style: :bold)
    pdf.move_down 12
    header = [ "Campo formativo", "T1", "T2", "T3", "Final" ]
    rows = data[:fields].map do |field|
      [ field[:name] ] + field[:terms].map { |value| value.nil? ? "—" : value.to_i.to_s } +
        [ field[:final]&.to_s || "Pend." ]
    end
    table = [ header ] + rows
    pdf.table(table, header: true, width: pdf.bounds.width,
      column_widths: { 0 => 290 }, cell_style: { size: 8, padding: 7, overflow: :shrink_to_fit }) do |grid|
      grid.row(0).background_color = "213E6C"
      grid.row(0).text_color = "FFFFFF"
    end
    pdf.move_down 12
    if data[:term].zero?
      pdf.text "Promedio anual del grado: #{data[:annual_average] || 'Pendiente'}", size: 11, style: :bold
      pdf.text "Resultado académico de referencia: #{data[:recommendation]}", size: 9
      pdf.text "Resultado autorizado: #{data[:outcome] || 'Pendiente de autorización'}", size: 9
    end
    pdf.move_down 14
    pdf.text "OBSERVACIONES Y SUGERENCIAS", size: 10, style: :bold
    data[:fields].each do |field|
      pdf.start_new_page if pdf.cursor < 100
      pdf.text field[:name], size: 8, style: :bold
      terms = data[:term].zero? ? (1..3) : [ data[:term] ]
      terms.each do |term|
        observation = field[:observations][term - 1].presence || "Sin observaciones registradas"
        pdf.text "Trimestre #{term}: #{observation}", size: 8
      end
      pdf.move_down 6
    end
    pdf.start_new_page if pdf.cursor < 120
    attendance = data[:attendance] || {}
    attended = attendance.fetch("present", 0) + attendance.fetch("late", 0)
    pdf.text "Asistencias registradas: #{attended} · Inasistencias: #{attendance.fetch('absent', 0)}",
      size: 8
    pdf.move_down 12
    pdf.text "La asistencia es informativa y no se utiliza como criterio de acreditación.", size: 8
    pdf.text "Cálculo: #{data[:rule_version]} · Decimales: #{data[:decimal_mode]}", size: 7
    pdf.move_down 18
    pdf.text "Firma de la autoridad escolar: ___________________________________", size: 8
    pdf.text "Documento de consulta interna. Para trámites oficiales utilice la boleta validada por la autoridad educativa.",
      size: 7, color: "666666"
    pdf.number_pages "Página <page> de <total>", at: [ pdf.bounds.right - 110, 0 ],
      width: 110, align: :right, size: 8
    pdf.render
  end
end
