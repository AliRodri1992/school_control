class ValidateCatalogImport
  FIELDS = {
    "subjects" => %w[name code],
    "groups" => %w[academic_year grade_level section capacity]
  }.freeze
  ALIASES = {
    "subjects" => { "nombre" => "name", "materia" => "name", "name" => "name",
      "clave" => "code", "codigo" => "code", "código" => "code", "code" => "code" },
    "groups" => { "ciclo" => "academic_year", "ciclo escolar" => "academic_year",
      "academic_year" => "academic_year", "grado" => "grade_level",
      "grade_level" => "grade_level", "seccion" => "section", "sección" => "section",
      "section" => "section", "cupo" => "capacity", "capacity" => "capacity" }
  }.freeze

  def initialize(import)
    @import = import
  end

  def suggest(headers)
    headers.to_h { |header| [ header, ALIASES.fetch(@import.kind)[header.downcase.strip] ] }.compact
  end

  def validate_mapping!(headers, mapping)
    fields = FIELDS.fetch(@import.kind)
    raise ArgumentError, "Asociación inválida" unless mapping.is_a?(Hash)
    raise ArgumentError, "Campo de destino no válido" unless (mapping.keys - headers).empty? && (mapping.values - fields).empty?
    raise ArgumentError, "Campo de destino repetido" unless mapping.values.uniq.size == mapping.size
    raise ArgumentError, "Faltan campos obligatorios" unless (fields - mapping.values).empty?
  end

  def attributes(row, mapping)
    values = mapping.to_h { |header, field| [ field, row.fetch(header, "").to_s.strip ] }
    return values.slice("name", "code").symbolize_keys if @import.kind == "subjects"

    year = AcademicYear.find_by(name: values.fetch("academic_year"))
    raise ArgumentError, "Ciclo escolar no encontrado" unless year
    { academic_year: year, grade_level: Integer(values.fetch("grade_level")),
      section: values.fetch("section").upcase, capacity: Integer(values.fetch("capacity")) }
  rescue ArgumentError => error
    raise ArgumentError, error.message.include?("invalid value for Integer") ? "Grado y cupo deben ser enteros" : error.message
  end

  def record_class
    { "subjects" => Subject, "groups" => Group }.fetch(@import.kind)
  end

  def call(mapping)
    dataset = DataImportReader.new(@import).call
    validate_mapping!(dataset.fetch(:headers), mapping)
    errors = []
    seen = Set.new
    dataset.fetch(:rows).each do |line, row|
      begin
        attributes = attributes(row, mapping)
        key = @import.kind == "subjects" ? attributes[:code] : [ attributes[:academic_year].id, attributes[:grade_level], attributes[:section] ].join(":")
        raise ArgumentError, "Registro duplicado dentro del archivo" unless seen.add?(key)
        record = record_class.new(attributes)
        errors << { row: line, messages: record.errors.full_messages } unless record.valid?
      rescue ArgumentError => error
        errors << { row: line, messages: [ error.message ] }
      end
    end
    { total_rows: dataset.fetch(:rows).size, errors: errors.first(500) }
  end
end
