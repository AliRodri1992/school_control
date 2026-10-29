require "rails_helper"

RSpec.describe "Academic workflows" do
  let(:admin) { create(:user, role: "admin") }
  def ready!(admission)
    student = admission.student
    student.addresses.find_or_create_by!(country_code: "MX", line1: "Calle Aula 10", purpose: "home")
    student.phone_numbers.find_or_create_by!(number_e164: "+525500000001", purpose: "emergency")
    student.contacts.find_or_create_by!(name: "Responsable legal", relationship: "Tutor")
    admission.update!(status: "approved")
    admission
  end

  it "approves an application atomically and writes an audit entry" do
    admission = create(:admission)
    group = create(:group, academic_year: admission.academic_year)
    result = AdmitStudent.call(admission: ready!(admission), group: group, actor: admin)
    expect(result.student).to eq(admission.student)
    expect(admission.reload.status).to eq("approved")
    expect(AuditEvent.last.action).to eq("admission.formalized")
  end

  it "rejects a stale new-entry application after enrollment in another cycle" do
    first = create(:admission)
    second = create(:admission, student: first.student)
    AdmitStudent.call(admission: ready!(first), group: create(:group, academic_year: first.academic_year), actor: admin)
    expect { AdmitStudent.call(admission: ready!(second), group: create(:group, academic_year: second.academic_year), actor: admin) }.to raise_error(ActiveRecord::RecordInvalid)
    expect(Enrollment.count).to eq(1)
  end

  it "rejects duplicate approval" do
    admission = create(:admission)
    group = create(:group, academic_year: admission.academic_year)
    AdmitStudent.call(admission: ready!(admission), group: group, actor: admin)
    expect { AdmitStudent.call(admission: ready!(admission), group: group, actor: admin) }.to raise_error(ArgumentError)
    expect(Enrollment.count).to eq(1)
  end

  it "does not exceed group capacity" do
    admission = create(:admission)
    group = create(:group, academic_year: admission.academic_year, capacity: 1)
    AdmitStudent.call(admission: ready!(admission), group: group, actor: admin)
    another = create(:admission, academic_year: group.academic_year)
    expect { AdmitStudent.call(admission: ready!(another), group: group, actor: admin) }.to raise_error(ArgumentError, /cupo/)
    expect(another.reload.status).to eq("approved")
  end

  it "rolls back an incompatible group assignment" do
    admission = create(:admission)
    group = create(:group, academic_year: admission.academic_year, grade_level: 2)
    expect { AdmitStudent.call(admission: ready!(admission), group: group, actor: admin) }.to raise_error(ActiveRecord::RecordInvalid)
    expect(Enrollment.count).to eq(0)
    expect(admission.reload.status).to eq("approved")
  end

  it "creates exactly the requested periods and rejects accidental regeneration" do
    course = create(:course, weekly_periods: 5)
    GenerateSchedule.call(group: course.group)
    expect(course.schedule_slots.count).to eq(5)
    expect { GenerateSchedule.call(group: course.group) }.to raise_error(ArgumentError, /ya tiene/)
  end

  it "rolls back the entire generated schedule when it cannot fit" do
    course = create(:course, weekly_periods: 20)
    create(:course, group: course.group, weekly_periods: 20)
    expect { GenerateSchedule.call(group: course.group) }.to raise_error(ArgumentError, /suficientes/)
    expect(ScheduleSlot.count).to eq(0)
  end

  it "requires all three term marks to close the year" do
    enrollment = create(:enrollment)
    create(:course, group: enrollment.group)
    expect { CompleteEnrollment.call(enrollment: enrollment, outcome: "promoted", actor: admin) }.to raise_error(ArgumentError, /Faltan/)
  end

  it "closes a fully graded enrollment and preserves the record" do
    enrollment = create(:enrollment)
    course = create(:course, group: enrollment.group)
    (1..3).each do |term|
      grade = Grade.create!(enrollment: enrollment, course: course, term: term, score: 9)
      GradeWorkflow.review(grade: grade, actor: admin)
      GradeWorkflow.publish(grade: grade, actor: admin)
    end
    CompleteEnrollment.call(enrollment: enrollment, outcome: "promoted", actor: admin)
    expect(enrollment.reload.outcome).to eq("promoted")
    expect(enrollment.grades.count).to eq(3)
  end
end
