require "rails_helper"

RSpec.describe FamilyCurp do
  let(:curp) { "SABC850720HDFLRN" }

  def complete(part)
    values = FamilyCurp::VALUES
    sum = part.chars.each_with_index.sum { |char, index| values.index(char) * (18 - index) }
    part + ((10 - sum % 10) % 10).to_s
  end

  it "derives a 20th century birthday and encoded sex only for a check-digit-valid CURP" do
    parsed = described_class.parse(complete(curp + "0"))
    expect(parsed).to eq(birth_date: Date.new(1985, 7, 20), sex: "H")
  end

  it "derives a 21st century birthday from the alphabetic homonym character" do
    expect(described_class.parse(complete("SABC030219MDFLRNA")))
      .to eq(birth_date: Date.new(2003, 2, 19), sex: "M")
  end

  it "rejects impossible dates, invalid states, tampering and future dates" do
    expect(described_class.parse(complete("SABC850230HDFLRN0"))).to be_nil
    expect(described_class.parse(complete("SABC850720HXXLRN0"))).to be_nil
    valid = complete(curp + "0")
    expect(described_class.parse(valid[0, 17] + ((valid[-1].to_i + 1) % 10).to_s)).to be_nil
    expect(described_class.parse(complete("SABC991231HDFLRNA"))).to be_nil
  end
end
