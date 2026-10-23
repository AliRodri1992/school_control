class DataImportReader
  MAX_ROWS = 5_000
  MAX_COLUMNS = 50

  def initialize(data_import)
    @data_import = data_import
  end

  def call
    @data_import.file.open do |file|
      extension = @data_import.file.filename.extension.to_s.downcase
      raise ArgumentError, "Formato no permitido" unless %w[csv xlsx].include?(extension)
      workbook = Roo::Spreadsheet.open(file.path, extension: extension.to_sym)
      sheet = workbook.sheet(0)
      count = sheet.last_row.to_i
      raise ArgumentError, "El archivo no contiene registros" if count < 2
      raise ArgumentError, "El archivo supera el máximo de #{MAX_ROWS} filas" if count - 1 > MAX_ROWS
      headers = sheet.row(1).map { |value| value.to_s.strip }
      raise ArgumentError, "Demasiadas columnas" if headers.length > MAX_COLUMNS
      raise ArgumentError, "Los encabezados deben ser únicos y no vacíos" if headers.any?(&:blank?) || headers.uniq.length != headers.length
      rows = (2..count).map do |number|
        values = sheet.row(number).map { |value| value.respond_to?(:iso8601) ? value.iso8601 : value.to_s.strip }
        [number, headers.zip(values).to_h]
      end
      { headers: headers, rows: rows.reject { |_line, values| values.values.all?(&:blank?) } }
    end
  end
end
