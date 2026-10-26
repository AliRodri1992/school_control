class NotifySchoolActivity
  MODELS = {
    "Student" => [ Student, "students", "Se actualizó un expediente" ],
    "Admission" => [ Admission, "admissions", "Hay una actualización en una solicitud" ],
    "Enrollment" => [ Enrollment, "enrollments", "Se actualizó una inscripción" ],
    "GradeChangeRequest" => [ GradeChangeRequest, "grades", "Hay una actualización en una solicitud de corrección" ],
    "Grade" => [ Grade, "grades", "Hay una actualización de calificaciones" ],
    "Attendance" => [ Attendance, "attendances", "Se registró asistencia" ],
    "InstitutionalMessage" => [ InstitutionalMessage, "messages", "Tienes un mensaje institucional" ],
    "StudentDocument" => [ StudentDocument, "documents", "Hay una actualización documental" ],
    "Assignment" => [ Assignment, "classroom", "Hay una actualización de tareas" ],
    "AssignmentSubmission" => [ AssignmentSubmission, "classroom", "Hay una actualización de una entrega" ]
  }.freeze

  def self.call(event)
    return if %w[message.read document.downloaded].include?(event.action)
    model, page, title = MODELS.fetch(event.record_type, [ nil, "dashboard", "Se registró una actualización en tu portal" ])
    record = model&.find_by(id: event.record_id)
    # Drafts and internal reviews must not notify families before publication.
    return if record.is_a?(Grade) && !%w[grade.published grade.corrected].include?(event.action)
    recipients = [ event.user ]
    if record.is_a?(GradeChangeRequest)
      recipients << record.requester
      recipients.concat(User.where(role: "admin", active: true).to_a) if record.status == "pending"
    elsif record.is_a?(InstitutionalMessage)
      recipients << record.recipient
    elsif record.is_a?(StudentDocument)
      recipients << record.student.guardian
    elsif record.is_a?(Assignment)
      if record.published?
        students = Student.where(id: Enrollment.where(group_id: record.course.group_id, status: "active").select(:student_id))
        recipients.concat(User.where(id: students.select(:guardian_id)).or(User.where(id: students.select(:user_id))).to_a)
      end
    else
      student = case record
      when Student then record
      when Admission, Enrollment then record.student
      when Grade, Attendance, AssignmentSubmission then record.enrollment.student
      end
      recipients.concat([ student.guardian, student.user ]) if student
    end
    recipients = recipients.compact.select(&:active?).uniq.select do |recipient|
      preference = recipient.user_preference
      next true unless preference
      next false if !preference.notification_school && page != "grades" && page != "attendances"
      next false if page == "grades" && !preference.notification_grades
      next false if page == "attendances" && !preference.notification_attendance
      next false if page == "calendar_events" && !preference.notification_events

      true
    end
    ActivityNotifier.with(title: title, page: page, audit_event_id: event.id).deliver(recipients) if recipients.any?
  end
end
