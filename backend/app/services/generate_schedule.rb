class GenerateSchedule
  # A deterministic first-fit allocator. The entire cycle is locked so parallel
  # manual edits and generators cannot assign the same teacher or room twice.
  def self.call(group:)
    group.academic_year.with_lock do
      courses = group.courses.order(weekly_periods: :desc, id: :asc).to_a
      raise ArgumentError, "Agregue materias al grupo" if courses.empty?
      raise ArgumentError, "El grupo ya tiene horarios; elimínelos antes de regenerar" if ScheduleSlot.where(course: courses).exists?
      courses.each do |course|
        course.weekly_periods.times do
          slot = candidates(course).find(&:valid?)
          raise ArgumentError, "No hay suficientes espacios sin conflictos. Ajuste docentes o cargas." unless slot
          slot.save!
        end
      end
    end
  end

  def self.candidates(course)
    [ 480, 530, 580, 660, 710, 760 ].flat_map do |start|
      (1..5).map do |day|
        ScheduleSlot.new(course: course, weekday: day, starts_minute: start,
          ends_minute: start + 50, room: "Aula #{course.group.grade_level}#{course.group.section}")
      end
    end
  end
end
