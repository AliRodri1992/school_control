class ValidateStudentImport
  FIELDS = %w[first_name last_name curp birth_date guardian_email].freeze
  ALIASES = {
    "nombre" => "first_name", "first_name" => "first_name", "nombre alumno" => "first_name",
    "apellidos" => "last_name", "apellido" => "last_name", "last_name" => "last_name",
    "curp" => "curp", "nacimiento" => "birth_date", "fecha nacimiento" => "birth_date",
    "birth_date" => "birth_date", "email tutor" => "guardian_email",
    "correo tutor" => "guardian_email", "guardian_email" => "guardian_email"
  }.freeze

  def initialize(import)
    @import = import
  end

  def suggest(headers)
    headers.to_h { |header| [ header, ALIASES[header.downcase.strip] ] }.compact
  end

  def validate_mapping!(headers, mapping)
    raise ArgumentError, "Asociación de columnas inválida" unless mapping.is_a?(Hash)
    raise ArgumentError, "Campos de destino no válidos" unless (mapping.keys - headers).empty? && (mapping.values - FIELDS).empty?
    raise ArgumentError, "No se puede asignar dos veces el mismo campo" unless mapping.values.uniq.length == mapping.size
    raise ArgumentError, "Faltan columnas obligatorias" unless (FIELDS - mapping.values).empty?
  end

  def attributes(row, mapping)
    values = mapping.to_h { |header, field| [ field, row[header].to_s.strip ] }
    guardian = User.find_by(email: values.fetch("guardian_email").downcase, role: "guardian", active: true)
    raise ArgumentError, "Tutor no encontrado" unless guardian
    date = Date.iso8601(values.fetch("birth_date"))
    { first_name: values.fetch("first_name"), last_name: values.fetch("last_name"),
      curp: values.fetch("curp"), birth_date: date, guardian: guardian }
  rescue Date::Error
    raise ArgumentError, "Fecha de nacimiento no válida"
  end

  def call(mapping)
    dataset = DataImportReader.new(@import).call
    validate_mapping!(dataset[:headers], mapping)
    seen = Set.new
    errors = []
    dataset[:rows].each do |line, row|
      begin
        attrs = attributes(row, mapping)
        identifier = attrs[:curp].strip.upcase
        raise ArgumentError, "CURP duplicada dentro del archivo" unless seen.add?(identifier)
        record = Student.new(attrs)
        errors << { row: line, messages: record.errors.full_messages } unless record.valid?
      rescue ArgumentError => e
        errors << { row: line, messages: [ e.message ] }
      end
    end
    { total_rows: dataset[:rows].length, errors: errors.first(500) }
  end
end
