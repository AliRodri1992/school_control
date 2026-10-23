module Api
  class StudentsController < ApplicationController
    after_action :verify_policy_scoped, only: :index
    after_action :verify_authorized, except: :index
    def index
      render json: policy_scope(Student).order(:last_name, :first_name).map { |student| present(student) }
    end

    def show
      student = students_scope.find(params[:id])
      authorize student, :show?
      render json: present(student)
    end

    def create
      attrs = params.permit(:first_name, :last_name, :curp, :birth_date, :emergency_phone, :address)
      attrs[:guardian_id] = institution_access? ? params.require(:guardian_id) : current_user.id
      student = Student.new(attrs)
      authorize student, :create?
      student.transaction do
        student.save!
        audit(student, "student.created")
      end
      render json: present(student), status: :created
    end

    def update
      student = students_scope.find(params[:id])
      authorize student, :update?
      fields = %i[emergency_phone address]
      fields += %i[first_name last_name curp birth_date] if institution_access? || student.enrollments.empty?
      student.with_lock do
        student.update!(params.permit(*fields))
        audit(student, "student.updated")
      end
      render json: present(student)
    end

    def report
      student = students_scope.find(params[:id])
      authorize student, :report?
      enrollments = enrollments_scope.where(student: student).includes(:academic_year, :group).order(:academic_year_id)
      render json: { student: present(student), years: enrollments.map { |enrollment|
        { enrollment: present(enrollment), grades: report_grades(enrollment).includes(course: :subject).map { |grade| present(grade) },
          attendance: enrollment.attendances.group(:status).count }
      } }
    end
    private

    def report_grades(enrollment)
      access.grades.where(enrollment: enrollment)
    end
  end
end
