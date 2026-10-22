require "rails_helper"

RSpec.describe PasswordMailer, type: :mailer do
  it "sends a branded recovery link without requiring activity mail opt-in" do
    School.create!(name: "Primaria del Valle")
    user = create(:user, email_notifications: false, name: "<script>unsafe</script>")
    message = described_class.with(recipient: user).recovery
    expect(message.to).to eq([ user.email ])
    expect(message.subject).to include("Primaria del Valle")
    expect(message.html_part.body.decoded).to include("&lt;script&gt;", "15 minutos", "#reset-password=")
    expect(message.html_part.body.decoded).not_to include("<script>")
    token = CGI.unescape(message.text_part.body.decoded[/#reset-password=(\S+)/, 1])
    expect(User.find_by_token_for(:password_recovery, token)).to eq(user)
  end
end
