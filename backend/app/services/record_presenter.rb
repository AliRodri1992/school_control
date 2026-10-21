class RecordPresenter
  def self.call(record)
    case record
    when User
      record.as_json(only: %i[id name email role active])
    when Student
      record.as_json(only: %i[id first_name last_name curp birth_date emergency_phone address guardian_id user_id]).merge(full_name: record.full_name)
    when School
      record.as_json(only: %i[id name code address phone]).merge(logo_url: record.logo.attached? ? Rails.application.routes.url_helpers.rails_blob_path(record.logo, only_path: true) : nil)
    when Group
      record.as_json.merge(label: record.label, occupied: record.enrollments.count)
    when Course
      record.as_json.merge(label: record.label, teacher_name: record.teacher.name, subject_name: record.subject.name)
    when Admission
      record.as_json.merge(student_name: record.student.full_name, year_name: record.academic_year.name)
    when Enrollment
      record.as_json.merge(student_name: record.student.full_name, group_label: record.group.label)
    when ScheduleSlot
      record.as_json.merge(course_label: record.course.label, teacher_name: record.course.teacher.name, group_id: record.course.group_id)
    when Grade
      record.as_json.merge(subject_name: record.course.subject.name, student_name: record.enrollment.student.full_name)
    when Attendance
      record.as_json.merge(student_name: record.enrollment.student.full_name)
    else
      record.as_json
    end
  end
end
