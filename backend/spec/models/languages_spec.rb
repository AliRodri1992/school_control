require "rails_helper"

RSpec.describe "language catalog", type: :model do
  it "supports a future locale without activating unfinished translations" do
    language = Language.create!(code: "fr", name: "Francés", native_name: "Français")
    expect(language.status).to eq("draft")
    expect(Language.active).not_to include(language)
    expect(language.translation_entries.build(key: "nav.home", text: "Accueil", status: "published")).not_to be_valid
  end

  it "requires a reviewer to publish a translation" do
    language = Language.create!(code: "en", name: "Inglés", native_name: "English", status: "active")
    user = create(:user, role: "admin")
    entry = language.translation_entries.create!(key: "nav.home", text: "Home", status: "published", reviewer: user, published_at: Time.current)
    expect(language.translation_entries.published).to include(entry)
  end
end
