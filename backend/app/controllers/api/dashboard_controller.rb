module Api
  class DashboardController < ApplicationController
    def show
      scope = enrollments_scope
      absences = Attendance.where(enrollment: scope, on: 30.days.ago.to_date..Date.current, status: "absent").group(:enrollment_id).count
      alerts = scope.where(id: absences.select { |_id, count| count >= 3 }.keys).includes(:student).map do |enrollment|
        { student_name: enrollment.student.full_name, message: "#{absences[enrollment.id]} inasistencias en 30 días", kind: "attendance" }
      end
      render json: { students: students_scope.count, enrollments: scope.where(status: "active").count,
        pending_admissions: Admission.where(student: students_scope, status: "submitted").count,
        groups: groups_scope.count, alerts: alerts }
    end
  end
end
