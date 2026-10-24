module Api
  class DashboardController < ApplicationController
    def show
      group = groups_scope.find(params[:group_id]) if params[:group_id].present?
      scope = group ? enrollments_scope.where(group: group) : enrollments_scope
      absences = Attendance.where(enrollment: scope, on: 30.days.ago.to_date..Date.current, status: "absent").group(:enrollment_id).count
      alerts = scope.where(id: absences.select { |_id, count| count >= 3 }.keys).includes(:student).map do |enrollment|
        { student_name: enrollment.student.full_name, message: "#{absences[enrollment.id]} inasistencias en 30 días", kind: "attendance" }
      end
      render json: { students: group ? scope.select(:student_id).distinct.count : students_scope.count,
        today_classes: ScheduleSlot.where(course: courses_scope, weekday: Date.current.cwday).count,
        grade_drafts: educator_access? ? Grade.where(course: courses_scope, status: "draft").count : 0,
        pending_documents: current_user.can?("student_documents.index") ?
          StudentDocument.where(student: SchoolAccess.new(current_user, "student_documents.index").students, status: "pending").count : 0,
        enrollments: scope.where(status: "active").count,
        pending_admissions: Admission.where(student: group ? scope.select(:student_id) : students_scope, status: "submitted").count,
        groups: group ? 1 : groups_scope.count, alerts: alerts,
        attendance_chart: Attendance.where(enrollment: scope, on: 30.days.ago.to_date..Date.current).group(:status).count,
        admission_chart: Admission.where(student: students_scope).group(:status).count }
    end
  end
end
