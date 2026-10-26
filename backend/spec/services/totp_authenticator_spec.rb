require "rails_helper"

RSpec.describe TotpAuthenticator do
  it "generates and verifies a 30-second RFC6238 code only once" do
    secret = described_class.generate_secret
    expect(secret).to match(/\A[A-Z2-7]+\z/)
    expect(described_class.decrypt(described_class.encrypt(secret))).to eq(secret)
    step = Time.current.to_i / 30
    code = described_class.hotp(secret, step)
    expect(described_class.valid_step(secret, code)).to eq(step)
    expect(described_class.valid_step(secret, code, after: step)).to be_nil
    expect(described_class.valid_step(secret, "1000000")).to be_nil
    expect(described_class.uri(secret, "teacher@school.test")).to include("otpauth://totp/")
  end

  it "enables an account with one-time recovery codes and rejects replayed codes" do
    user = create(:user)
    credential = TotpCredential.create_for!(user)
    code = described_class.hotp(credential.secret, Time.current.to_i / 30)
    codes = credential.activate!(code)
    expect(credential.enabled?).to be(true)
    expect(codes.length).to eq(8)
    expect(credential.verify!(code)).to be(false)
    expect(credential.verify!(codes.first)).to be(true)
    expect(credential.verify!(codes.first)).to be(false)
  end
end
