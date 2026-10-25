require "rails_helper"

RSpec.describe "dashboard KPI widget catalog", type: :model do
  it "supports role-specific smart dashboard widgets in saved layouts" do
    expect(DashboardPreference::KINDS).to include("today_classes", "grade_drafts", "pending_documents", "enrollment_trend", "attendance_rate", "grades_by_term", "assignment_progress")
  end
  it "rejects administrator-only chart types in a family preference while retaining existing widgets" do
    guardian = create(:user, role: "guardian")
    config = {
      "widgets" => [ { "id" => "bad_chart", "kind" => "enrollment_trend", "title" => "Matrícula" } ],
      "layouts" => DashboardPreference::COLUMNS.transform_values { [ { "i" => "bad_chart", "x" => 0, "y" => 0, "w" => 1, "h" => 4 } ] }
    }
    expect(DashboardPreference.new(user: guardian, configuration: config)).not_to be_valid
    config["widgets"].first["kind"] = "grades_by_term"
    expect(DashboardPreference.new(user: guardian, configuration: config)).to be_valid
  end
end
