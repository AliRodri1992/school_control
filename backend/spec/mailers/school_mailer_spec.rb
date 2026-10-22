require "rails_helper"

RSpec.describe SchoolMailer, type: :mailer do
  it "renders school branding and escapes configurable text" do
    School.create!(name: "Primaria del Valle")
    user = create(:user, name: "<script>unsafe</script>")
    template = EmailTemplate.activity
    template.body = "<img src=x onerror=alert(1)>"
    template.save!
    message = described_class.with(recipient: user).activity
    expect(message.to).to eq([ user.email ])
    expect(message.subject).to include("Primaria del Valle")
    html = message.html_part.body.decoded
    expect(html).to include("Primaria del Valle", "&lt;script&gt;", "&lt;img")
    expect(html).not_to include("<script>", "<img src=x")
    expect(message.text_part.body.decoded).to include(template.body)
  end
end
