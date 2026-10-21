module Api
  class StudentsController < ApplicationController
    def index
      render json: students_scope.order(:last_name, :first_name).map { |student| present(student) }
    end

    def show
      render json: present(students_scope.find(params[:id]))
    end

    def create
      unless current_user.admin? || current_user.guardian?
        return render json: { error: "No puedes registrar alumnos" }, status: :forbidden
      end
      attrs = params.permit(:first_name, :last_name, :curp, :birth_date, :emergency_phone, :address)
      attrs[:guardian_id] = current_user.admin? ? params.require(:guardian_id) : current_user.id
      student = Student.create!(attrs)
      render json: present(student), status: :created
    end

    def update
      student = students_scope.find(params[:id])
      unless current_user.admin? || current_user.guardian?
        return render json: { error: "Sin permiso para editar expedientes" }, status: :forbidden
      end
      fields = %i[emergency_phone address]
      fields += %i[first_name last_name curp birth_date] if current_user.admin? || student.enrollments.empty?
      student.update!(params.permit(*fields))
      render json: present(student)
    end

    def report
      student = students_scope.find(params[:id])
      enrollments = enrollments_scope.where(student: student).includes(:academic_year, :group).order(:academic_year_id)
      render json: { student: present(student), years: enrollments.map { |enrollment|
        { enrollment: present(enrollment), grades: enrollment.grades.includes(course: :subject).map { |grade| present(grade) },
          attendance: enrollment.attendances.group(:status).count }
      } }
    end
  end
end
