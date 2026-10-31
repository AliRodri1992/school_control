# Deterministic, development-only calendars; no external SEP import is implied.
# Create each cycle's complete calendar BEFORE attaching school records.
module DemoSchoolCycles
  def self.current!(start_year:, today: Date.current)
    create_year!(name: "#{start_year}–#{start_year + 1}", start_year: start_year,
      admissions: [ today - 30.days, today + 60.days ],
      reenrollments: [ today - 30.days, today + 60.days ])
  end

  def self.next!(current:)
    year = current.starts_on.year + 1
    create_year!(name: "#{year}–#{year + 1}", start_year: year,
      admissions: [ Date.new(year, 2, 1), Date.new(year, 4, 30) ],
      reenrollments: [ Date.new(year, 5, 1), Date.new(year, 7, 30) ])
  end

  def self.historical!(current:, offset:)
    year = current.starts_on.year - offset
    create_year!(name: "Demo histórico #{year}", start_year: year,
      admissions: [ Date.new(year, 2, 1), Date.new(year, 4, 30) ],
      reenrollments: [ Date.new(year, 5, 1), Date.new(year, 7, 30) ])
  end

  def self.create_year!(name:, start_year:, admissions:, reenrollments:)
    raise "Los ciclos de demostración no pueden ejecutarse en producción" unless Rails.env.development? || Rails.env.test?

    AcademicYear.find_or_create_by!(name: name) do |record|
      starts_on = Date.new(start_year, 8, 31)
      ends_on = Date.new(start_year + 1, 7, 9)
      first_end = Date.new(start_year, 11, 27)
      second_end = Date.new(start_year + 1, 3, 26)
      record.assign_attributes(
        starts_on: starts_on, ends_on: ends_on,
        admissions_open_on: admissions.first, admissions_close_on: admissions.last,
        reenrollment_open_on: reenrollments.first, reenrollment_close_on: reenrollments.last,
        first_term_starts_on: starts_on, first_term_ends_on: first_end,
        second_term_starts_on: first_end + 1.day, second_term_ends_on: second_end,
        third_term_starts_on: second_end + 1.day, third_term_ends_on: ends_on,
        first_term_capture_opens_on: first_end - 11.days,
        first_term_capture_closes_on: first_end - 6.days,
        first_term_review_on: first_end - 3.days, first_term_reports_on: first_end,
        second_term_capture_opens_on: second_end - 11.days,
        second_term_capture_closes_on: second_end - 6.days,
        second_term_review_on: second_end - 3.days, second_term_reports_on: second_end,
        third_term_capture_opens_on: ends_on - 11.days,
        third_term_capture_closes_on: ends_on - 6.days,
        third_term_review_on: ends_on - 3.days, third_term_reports_on: ends_on,
        administrative_closes_on: ends_on + 30.days,
        archive_on: ends_on + 5.years,
        planned_school_days: 185, calendar_source: "manual",
        calendar_source_reference: "Calendario ficticio de demostración; no es un calendario oficial",
        notes: "Fechas ilustrativas para ensayar inscripciones, trimestres, cierre y archivo."
      )
    end
  end

  def self.seed_calendar!(year)
    # Calendar events are deliberately fictional, not official SEP dates.
    [
      [ "Suspensión de ejemplo · septiembre", "suspension",
        Date.new(year.starts_on.year, 9, 16), Date.new(year.starts_on.year, 9, 16) ],
      [ "Consejo técnico de ejemplo · octubre", "cte",
        Date.new(year.starts_on.year, 10, 30), Date.new(year.starts_on.year, 10, 30) ],
      [ "Vacaciones de invierno · ejemplo", "vacation",
        Date.new(year.starts_on.year, 12, 21), Date.new(year.starts_on.year + 1, 1, 3) ],
      [ "Vacaciones de primavera · ejemplo", "vacation",
        Date.new(year.starts_on.year + 1, 4, 12), Date.new(year.starts_on.year + 1, 4, 18) ]
    ].each do |title, kind, first_day, last_day|
      year.calendar_events.find_or_create_by!(title: title) do |event|
        event.assign_attributes(kind: kind, all_day: true, source_type: "manual",
          source_reference: "Ejemplo ficticio, no oficial", official: false,
          starts_at: first_day.in_time_zone,
          ends_at: (last_day + 1.day).in_time_zone)
      end
    end
  end

  def self.seed_future_application!(year:, guardian:)
    student = Student.find_or_create_by!(curp: "DEMO210316HDFRNN01") do |person|
      person.assign_attributes(first_name: "Emilio", last_name: "Ejemplo",
        birth_date: Date.new(2021, 3, 16), guardian: guardian, nationality: "MX")
    end
    Admission.find_or_create_by!(student: student, academic_year: year) do |application|
      application.assign_attributes(kind: "new", grade_level: 1, status: "draft")
    end
  end

  def self.finalize!(current:, upcoming:)
    # Never assign statuses directly. All historical cycles must finish before
    # activating the current year: a single active cycle is enforced in PostgreSQL.
    historical = AcademicYear.where("name LIKE ? OR name LIKE ?", "Demo histórico %", "Demo archivado %")
      .order(:starts_on, :id)
    historical.each do |year|
      while %w[draft active closing closed].include?(year.reload.status)
        break unless AcademicYearLifecycle.advance!(year, trigger: "demo_seed")
      end
      blockers = AcademicYearLifecycle.preview(year)[:critical].select do |check|
        check[:blocking] && !check[:ok] && check[:key] != "date"
      end
      if %w[draft active closing].include?(year.reload.status)
        raise "No se pudo cerrar el ciclo histórico #{year.name}: #{blockers.map { |item| item[:label] }.join(', ')}"
      end
    end

    # During the July/August summer break the previous year may be closing
    # and the upcoming year is still in preparation; do not invent an active one.
    2.times do
      break unless AcademicYearLifecycle.advance!(current, trigger: "demo_seed")
    end
    expected = if Date.current < current.starts_on
      "draft"
    elsif Date.current >= current.ends_on
      "closing"
    else
      "active"
    end
    raise "El ciclo de demostración debe estar #{expected}" unless current.reload.status == expected
    raise "El siguiente ciclo debe permanecer En preparación" unless upcoming.reload.status == "draft"
  end
end
