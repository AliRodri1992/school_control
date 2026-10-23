require "rails_helper"
require "json"

RSpec.describe "API documentation" do
  let(:contract) { JSON.parse(Rails.root.join("openapi/v1.json").read) }

  it "publishes a parseable OpenAPI 3.1 contract" do
    expect(contract.fetch("openapi")).to eq("3.1.0")
    expect(contract.fetch("paths")).to include("/api/students", "/api/grades", "/api/session", "/api/notifications")
  end

  it "documents protected actions and their RBAC permission keys" do
    operation = contract.fetch("paths").fetch("/api/students").fetch("post")
    expect(operation.fetch("x-rbac-permission")).to eq("students.create")
    expect(operation.fetch("responses")).to have_key("422")
  end
end
