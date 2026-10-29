require "rails_helper"

RSpec.describe "School domain" do
  describe User do
    subject { build(:user) }
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_length_of(:password).is_at_least(12) }
    it { is_expected.to validate_inclusion_of(:role).in_array(%w[admin teacher guardian student]) }
    it "normalizes email" do
      expect(build(:user, email: " FAMILY@SCHOOL.TEST ").email).to eq("family@school.test")
    end
  end

  describe Student do
    subject { build(:student) }
    it { is_expected.to belong_to(:guardian) }
    it { is_expected.to validate_presence_of(:first_name) }
    it "keeps an applicant outside enrolled student counts until enrollment exists" do
      applicant = create(:student)
      expect(applicant.enrollment_stage).to eq("applicant")
      admission = create(:admission, student: applicant)
      expect(applicant.reload.enrollment_stage).to eq("applicant")
      create(:enrollment, admission: admission)
      expect(applicant.reload.enrollment_stage).to eq("enrolled")
      expect(RecordPresenter.call(applicant)).to include(enrollment_stage: "enrolled")
    end
    it "rejects an invalid CURP" do
      expect(build(:student, curp: "invalid")).not_to be_valid
    end
    it "does not accept a teacher as guardian" do
      expect(build(:student, guardian: build(:user, role: "teacher"))).not_to be_valid
    end
    it "does not accept a guardian account as student login" do
      expect(build(:student, user: build(:user))).not_to be_valid
    end
    it "rejects future birth dates" do
      expect(build(:student, birth_date: Date.tomorrow)).not_to be_valid
    end
  end

  describe Admission do
    it "accepts a first grade application and assigns a folio" do
      record = create(:admission)
      expect(record.folio).to start_with("ESC-")
    end
    it "rejects closed registration windows" do
      year = create(:academic_year, admissions_close_on: Date.yesterday)
      expect(build(:admission, academic_year: year)).not_to be_valid
    end
    it "rejects direct new entry to second grade" do
      expect(build(:admission, grade_level: 2)).not_to be_valid
    end
    it "rejects reenrollment without prior history" do
      expect(build(:admission, kind: "reenrollment", grade_level: 2)).not_to be_valid
    end
    it "prevents duplicate student requests in one cycle" do
      existing = create(:admission)
      expect(build(:admission, student: existing.student, academic_year: existing.academic_year)).not_to be_valid
    end
    it "allows the next grade after promotion, but no skipped grade" do
      previous_year = create(:academic_year, starts_on: 2.years.ago.to_date, ends_on: 1.year.ago.to_date)
      previous = create(:enrollment, admission: create(:admission, academic_year: previous_year), status: "completed", outcome: "promoted")
      candidate = build(:admission, student: previous.student, kind: "reenrollment", grade_level: 2)
      expect(candidate).to be_valid
      candidate.grade_level = 3
      expect(candidate).not_to be_valid
    end
    it "allows repeating the same grade only when the previous outcome is repeat" do
      year = create(:academic_year, starts_on: 2.years.ago.to_date, ends_on: 1.year.ago.to_date)
      previous = create(:enrollment, admission: create(:admission, academic_year: year), status: "completed", outcome: "repeat")
      expect(build(:admission, student: previous.student, kind: "reenrollment", grade_level: 1)).to be_valid
    end
  end

  describe Grade do
    let(:enrollment) { create(:enrollment) }
    let(:course) { create(:course, group: enrollment.group) }
    it "rejects scores outside 0 to 10" do
      expect(Grade.new(enrollment: enrollment, course: course, term: 1, score: 11)).not_to be_valid
    end
    it "rejects marks for a different group" do
      expect(Grade.new(enrollment: enrollment, course: create(:course), term: 1, score: 9)).not_to be_valid
    end
    it "rejects changes after enrollment closure" do
      enrollment.update!(status: "completed", outcome: "promoted")
      expect(Grade.new(enrollment: enrollment, course: course, term: 1, score: 9)).not_to be_valid
    end
  end

  describe Attendance do
    it "rejects future attendance" do
      expect(Attendance.new(enrollment: create(:enrollment), on: Date.tomorrow, status: "present")).not_to be_valid
    end
    it "accepts a weekday within the cycle" do
      travel_to Time.zone.local(2026, 10, 20, 12) do
        expect(Attendance.new(enrollment: create(:enrollment), on: Date.current, status: "present")).to be_valid
      end
    end
    it "rejects weekend attendance" do
      travel_to Time.zone.local(2026, 10, 25, 12) do
        expect(Attendance.new(enrollment: create(:enrollment), on: Date.current, status: "present")).not_to be_valid
      end
    end
  end

  describe ScheduleSlot do
    it "rejects overlap for the same teacher across groups" do
      slot = create(:schedule_slot)
      other_group = create(:group, academic_year: slot.course.group.academic_year, section: "B")
      other_course = create(:course, group: other_group, teacher: slot.course.teacher)
      expect(build(:schedule_slot, course: other_course, room: "B")).not_to be_valid
    end
    it "rejects overlapping use of the same room" do
      slot = create(:schedule_slot)
      other_group = create(:group, academic_year: slot.course.group.academic_year, section: "B")
      expect(build(:schedule_slot, course: create(:course, group: other_group))).not_to be_valid
    end
    it "allows adjacent periods" do
      slot = create(:schedule_slot)
      expect(build(:schedule_slot, course: slot.course, starts_minute: 530, ends_minute: 580)).to be_valid
    end
    it "allows the same room in another academic year" do
      create(:schedule_slot)
      expect(build(:schedule_slot)).to be_valid
    end
  end
end
