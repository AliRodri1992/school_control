class ValidateGradeImport
  REQUIRED = %w[course_id enrollment_id term score].freeze
  FIELDS = (REQUIRED + %w[feedback]).freeze
  ALIASES = {
    "clase" => "course_id", "clase id" => "course_id", "course_id" => "course_id",
    "inscripción" => "enrollment_id", "inscripcion" => "enrollment_id",
    "matrícula id" => "enrollment_id", "enrollment_id" => "enrollment_id",
    "trimestre" => "term", "term" => "term",
    "calificación" => "score", "calificacion" => "score", "score" => "score",
    "retroalimentación" => "feedback", "observaciones" => "feedback",
    "feedback" => "feedback"
  }.freeze

  def initialize(import)
    @import = import
  end

  def suggest(headers)
    headers.to_h { |header| [ header, ALIASES[header.downcase.strip] ] }.compact
  end

  def validate_mapping!(headers, mapping)
    raise ArgumentError, "Asociación de columnas inválida" unless mapping.is_a?(Hash)
    raise ArgumentError, "Campo de destino no permitido" unless (mapping.keys - headers).empty? &&
      (mapping.values - FIELDS).empty?
    raise ArgumentError, "Campos de destino repetidos" unless mapping.values.uniq.length == mapping.length
    raise ArgumentError, "Faltan campos académicos obligatorios" unless (REQUIRED - mapping.values).empty?
  end

  def attributes(row, mapping)
    values = mapping.to_h { |header, field| [ field, row[header].to_s.strip ] }
    {
      course_id: Integer(values.fetch("course_id")),
      enrollment_id: Integer(values.fetch("enrollment_id")),
      term: Integer(values.fetch("term")),
      score: BigDecimal(values.fetch("score")),
      feedback: values["feedback"].presence,
      status: "draft"
    }
  rescue ArgumentError
    raise ArgumentError, "ID, trimestre o calificación con formato inválido"
  end

  def record_class = Grade

  def call(mapping)
    dataset = DataImportReader.new(@import).call
    validate_mapping!(dataset.fetch(:headers), mapping)
    errors = []
    seen = Set.new
    dataset.fetch(:rows).each do |line, row|
      begin
        attrs = attributes(row, mapping)
        identity = [ attrs[:course_id], attrs[:enrollment_id], attrs[:term] ]
        raise ArgumentError, "Calificación repetida dentro del archivo" unless seen.add?(identity)
        grade = Grade.new(attrs)
        errors << { row: line, messages: grade.errors.full_messages } unless grade.valid?
      rescue ArgumentError => error
        errors << { row: line, messages: [ error.message ] }
      end
    end
    { total_rows: dataset.fetch(:rows).size, errors: errors.first(500) }
  end
end
