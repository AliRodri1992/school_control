class ValidateUserImport
  FIELDS = %w[name email].freeze
  ALIASES = {
    "nombre" => "name", "nombre completo" => "name", "name" => "name",
    "correo" => "email", "correo electrónico" => "email",
    "email" => "email", "e-mail" => "email"
  }.freeze
  ROLES = { "teachers" => "teacher", "tutors" => "guardian" }.freeze

  def initialize(import)
    @import = import
  end

  def suggest(headers)
    headers.to_h { |header| [ header, ALIASES[header.downcase.strip] ] }.compact
  end

  def validate_mapping!(headers, mapping)
    raise ArgumentError, "Asociación de columnas inválida" unless mapping.is_a?(Hash)
    raise ArgumentError, "Campos de destino no válidos" unless (mapping.keys - headers).empty? &&
      (mapping.values - FIELDS).empty?
    raise ArgumentError, "No repitas el mismo campo" unless mapping.values.uniq.size == mapping.size
    raise ArgumentError, "Faltan nombre y correo" unless (FIELDS - mapping.values).empty?
  end

  def attributes(row, mapping)
    values = mapping.to_h { |header, field| [ field, row[header].to_s.strip ] }
    { name: values.fetch("name"), email: values.fetch("email").downcase, role: ROLES.fetch(@import.kind),
      password: SecureRandom.urlsafe_base64(36) }
  end

  def record_class = User

  def call(mapping)
    dataset = DataImportReader.new(@import).call
    validate_mapping!(dataset.fetch(:headers), mapping)
    seen = Set.new
    errors = []
    dataset.fetch(:rows).each do |line, row|
      begin
        attrs = attributes(row, mapping)
        raise ArgumentError, "Correo duplicado dentro del archivo" unless seen.add?(attrs[:email])
        candidate = User.new(attrs)
        errors << { row: line, messages: candidate.errors.full_messages } unless candidate.valid?
      rescue ArgumentError => error
        errors << { row: line, messages: [ error.message ] }
      end
    end
    { total_rows: dataset.fetch(:rows).size, errors: errors.first(500) }
  end
end
