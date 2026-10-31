require "rails_helper"
require Rails.root.join("db/demo_academics")

RSpec.describe DemoAcademics do
  let(:admin) { create(:user, role: "admin") }
  let(:year) do
    create(:academic_year, starts_on: Date.current - 28.days, ends_on: Date.current + 120.days)
  end
  let(:group) { create(:group, academic_year: year) }
  let(:teacher) { create(:user, role: "teacher") }

  def seed_student
    student = create(:student)
    admission = create(:admission, student: student, academic_year: year, grade_level: group.grade_level,
      status: "approved")
    create(:enrollment, student: student, academic_year: year, group: group, admission: admission,
      status: "active")
  end

  def seed_course(code, periods: 2)
    label = DemoAcademics::CORE_SUBJECTS.fetch(code).first
    subject = Subject.find_or_create_by!(code: code) { |record| record.name = label }
    create(:course, group: group, teacher: teacher, subject: subject, weekly_periods: periods)
  end

  it "fills multiple academic subjects, valid timetable slots and school-day attendance without duplicates" do
    student = seed_student
    spanish = seed_course("ESP")
    maths = seed_course("MAT")
    first_day = Date.current - 7.days
    existing = Attendance.create!(enrollment: student, on: first_day, status: "justified") if (1..5).cover?(first_day.wday)

    2.times { described_class.seed_group!(group: group, admin: admin) }

    expect(spanish.schedule_slots.count).to eq(2)
    expect(maths.schedule_slots.count).to eq(2)
    expect(student.grades.count).to eq(5) # 2 periods of evaluation and a third draft for Spanish
    expect(student.attendances.count).to eq(15)
    expect(existing.reload.status).to eq("justified") if existing
    expect(student.grades.where(term: 1).count).to eq(2)
    expect(student.grades.where(term: 3).count).to eq(1)
    expect(Assignment.where(course: [ spanish, maths ]).count).to eq(2)
    expect(student.student.notes.count).to be >= 1
  end

  it "does not create attendance on weekends or outside the academic year" do
    dates = described_class.school_days(year)
    expect(dates.length).to eq(15)
    expect(dates).to all(satisfy { |day| (1..5).cover?(day.wday) })
    expect(dates).to all(satisfy { |day| day.between?(year.starts_on, Date.current) })
  end

  it "keeps pending assignments for some pupils and reviewed submissions for others" do
    seed_course("ESP")
    7.times { seed_student }
    described_class.seed_group!(group: group, admin: admin)
    assignment = Assignment.find_by!(course: group.courses.joins(:subject).find_by!(subjects: { code: "ESP" }), title: "Actividad de Español · demostración")
    expect(assignment.published).to be(true)
    expect(assignment.assignment_submissions.count).to eq(5)
    expect(assignment.assignment_submissions.where.not(score: nil).count).to be_positive
  end
end
