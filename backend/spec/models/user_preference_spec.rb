require "rails_helper"

RSpec.describe UserPreference, type: :model do
  it "keeps language and theme settings attached to the account" do
    user = create(:user)
    preference = described_class.create!(user: user, locale: "es", theme: "dark", rows_per_page: 25)
    expect(preference.reload.theme).to eq("dark")
  end

  it "does not allow a guardian to select another family's child" do
    guardian = create(:user, role: "guardian")
    child = create(:student, guardian: create(:user, role: "guardian"))
    pref = described_class.new(user: guardian, selected_child: child)
    expect(pref).not_to be_valid
    expect(pref.errors[:selected_child]).to be_present
  end
  it "validates personal display and notification preferences" do
    pref = described_class.new(user: create(:user), time_format: "25h", notification_digest: "never")
    expect(pref).not_to be_valid
    expect(pref.errors[:time_format]).to be_present
    expect(pref.errors[:notification_digest]).to be_present
  end

  it "persists accessibility, privacy and calendar options for the account" do
    pref = described_class.create!(user: create(:user), high_contrast: true,
      hide_notification_previews: true, week_start: "sunday")
    expect(pref.reload).to have_attributes(high_contrast: true, hide_notification_previews: true, week_start: "sunday")
  end
end
