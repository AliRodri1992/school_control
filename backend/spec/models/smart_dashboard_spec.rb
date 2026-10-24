require "rails_helper"

RSpec.describe "dashboard KPI widget catalog", type: :model do
  it "supports role-specific smart dashboard widgets in saved layouts" do
    expect(DashboardPreference::KINDS).to include("today_classes", "grade_drafts", "pending_documents")
  end
end
