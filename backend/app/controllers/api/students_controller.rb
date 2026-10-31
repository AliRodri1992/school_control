module Api
  class StudentsController < ApplicationController
    after_action :verify_policy_scoped, only: :index
    after_action :verify_authorized, except: :index
    def index
      render json: policy_scope(Student).includes(:guardian, :enrollments).order(:last_name, :first_name).map { |student| present(student) }
    end

    def show
      student = students_scope.find(params[:id])
      authorize student, :show?
      render json: present(student)
    end

    def create
      attrs = params.permit(:first_name, :last_name, :curp, :birth_date, :second_last_name, :birth_place, :birth_state, :nationality, :sex, :emergency_phone, :address)
      attrs[:guardian_id] = institution_access? ? params[:guardian_id] : current_user.id
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
      fields += %i[first_name last_name second_last_name birth_place birth_state nationality sex curp birth_date] if institution_access? || student.enrollments.empty?
      student.with_lock do
        student.update!(params.permit(*fields))
        audit(student, "student.updated")
      end
      render json: present(student)
    end

    def acknowledge_report_card
      student = students_scope.find(params[:id])
      authorize student, :report?
      raise Pundit::NotAuthorizedError unless student.guardian_id == current_user.id
      issue = PrimaryReportCardIssue.joins(:enrollment)
        .where(enrollments: { student_id: student.id }).find(params[:issue_id])
      ack = issue.report_card_acknowledgments.find_or_create_by!(guardian: current_user) do |item|
        item.acknowledged_at = Time.current
      end
      audit(ack, "primary_report_card.acknowledged") if ack.previously_new_record?
      render json: { acknowledged_at: ack.acknowledged_at, issue_id: issue.id }
    end

    def report_card_issues
      student = students_scope.find(params[:id])
      authorize student, :report?
      issues = PrimaryReportCardIssue.joins(:enrollment)
        .where(enrollments: { student_id: student.id }).order(created_at: :desc)
      render json: issues.map { |issue| issue.as_json(only: %i[id enrollment_id term version rule_version sha256 created_at]).merge(
        acknowledged_at: issue.report_card_acknowledgments.find_by(guardian_id: current_user.id)&.acknowledged_at) }
    end

    def issue_report_card
      student = SchoolAccess.new(current_user, "students.update").students.find(params[:id])
      authorize student, :update?
      raise Pundit::NotAuthorizedError unless SchoolAccess.new(current_user, "students.update").institution?
      enrollment = student.enrollments.find(params.require(:enrollment_id))
      term = Integer(params.fetch(:term, 0))
      issue = nil
      enrollment.with_lock do
        generator = PrimaryReportCardPdf.new(enrollment: enrollment, term: term)
        snapshot = generator.snapshot
        pdf = generator.render(snapshot)
        next_version = enrollment.primary_report_card_issues.where(term: term).maximum(:version).to_i + 1
        issue = enrollment.primary_report_card_issues.create!(
          term: term, version: next_version, issued_by: current_user,
          rule_version: snapshot.fetch(:rule_version), snapshot: snapshot,
          sha256: Digest::SHA256.hexdigest(pdf)
        )
        issue.file.attach(io: StringIO.new(pdf), filename: "boleta-#{enrollment.id}-#{term}-v#{next_version}.pdf",
          content_type: "application/pdf")
        audit(issue, "primary_report_card.issued")
      end
      render json: issue.as_json(only: %i[id enrollment_id term version sha256 created_at]), status: :created
    end

    def download_report_card
      student = students_scope.find(params[:id])
      authorize student, :report?
      issue = PrimaryReportCardIssue.joins(:enrollment)
        .where(enrollments: { student_id: student.id }).find(params[:issue_id])
      raise ActiveRecord::RecordNotFound unless issue.file.attached?
      response.headers["Cache-Control"] = "private, no-store"
      send_data issue.file.download, type: "application/pdf",
        filename: "boleta-alumno-#{student.id}-v#{issue.version}.pdf", disposition: "attachment"
    end

    def report
      student = students_scope.find(params[:id])
      authorize student, :report?
      enrollments = enrollments_scope.where(student: student).includes(:academic_year, :group).order(:academic_year_id)
      render json: { student: present(student), primary_average: PrimarySchoolGrading.primary_average(enrollments.to_a), years: enrollments.map { |enrollment|
        grading = PrimarySchoolGrading.report(enrollment: enrollment)
        { enrollment: present(enrollment), evaluation_periods: enrollment.academic_year.evaluation_periods, grades: report_grades(enrollment).includes(course: :subject).order(:course_id, :term).map { |grade| present(grade) },
          formative_fields: grading[:fields], academic_result: grading,
          attendance: enrollment.attendances.group(:status).count }
      } }
    end
    private

    def permission_key
      return "students.report" if %w[report_card_issues download_report_card acknowledge_report_card].include?(action_name)
      return "students.update" if action_name == "issue_report_card"
      super
    end

    def report_grades(enrollment)
      access.grades.where(enrollment: enrollment)
    end
  end
end
