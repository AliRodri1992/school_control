require "rails_helper"
require Rails.root.join("db/demo_academics")
require Rails.root.join("db/demo_academic_history")

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

RSpec.describe DemoAcademicHistory do
  let(:teacher) { create(:user, role: "teacher") }
  let(:student) { create(:student) }
  let(:historical_year) do
    create(:academic_year, name: "Demo histórico 2024", starts_on: Date.new(2024, 8, 26),
      ends_on: Date.new(2025, 7, 16))
  end
  let(:historical_group) { create(:group, academic_year: historical_year, grade_level: 5) }
  let(:enrollment) do
    admission = create(:admission, student: student, academic_year: historical_year,
      grade_level: 5, kind: "reenrollment", status: "approved")
    create(:enrollment, admission: admission, group: historical_group,
      status: "completed", outcome: "promoted")
  end
  let(:subjects) do
    DemoAcademics::CORE_SUBJECTS.to_h do |code, (name, _)|
      [ code, Subject.find_or_create_by!(code: code) { |subject| subject.name = name } ]
    end
  end

  it "fills ten subjects and three published marks per subject in each completed grade" do
    2.times do
      described_class.seed_group!(group: historical_group, enrollments: [ enrollment ],
        teacher: teacher, subjects: subjects)
    end

    expect(historical_group.courses.count).to eq(10)
    expect(enrollment.grades.count).to eq(30)
    expect(enrollment.grades.distinct.count(:course_id)).to eq(10)
    expect(enrollment.grades.group(:term).count).to eq({ 1 => 10, 2 => 10, 3 => 10 })
    expect(enrollment.grades.distinct.pluck(:status)).to eq([ "published" ])
    expect(enrollment.grades.all? { |grade| grade.published_at.to_date <= historical_year.ends_on }).to be(true)
  end

  it "preserves existing historical marks while filling the remaining terms" do
    spanish = create(:course, group: historical_group, teacher: teacher, subject: subjects.fetch("ESP"))
    original = Grade.new(enrollment: enrollment, course: spanish, term: 1,
      score: 9.75, status: "published", reviewer: teacher)
    original.correction_authorized = true # Completed-year fixtures use the correction-authorized path.
    original.save!

    described_class.seed_group!(group: historical_group, enrollments: [ enrollment ],
      teacher: teacher, subjects: subjects)
    expect(original.reload.score).to eq(9.75)
    expect(enrollment.grades.count).to eq(30)
    expect(Grade.where(enrollment: enrollment, course: spanish).count).to eq(3)
  end

  it "refuses to create historical grades for active enrollments" do
    enrollment.update!(status: "active", outcome: nil)
    expect do
      described_class.seed_group!(group: historical_group, enrollments: [ enrollment ],
        teacher: teacher, subjects: subjects)
    end.to raise_error(RuntimeError, /completadas/)
    expect(Grade.count).to eq(0)
  end
end
