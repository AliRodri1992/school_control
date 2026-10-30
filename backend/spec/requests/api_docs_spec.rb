require "rails_helper"

RSpec.describe "API documentation endpoint", type: :request do
  it "requires authentication" do
    get "/api/docs"
    expect(response).to have_http_status(:unauthorized)
  end
end

RSpec.describe "OpenAPI request contracts" do
  let(:document) { JSON.parse(Rails.root.join("openapi/v1.json").read) }

  it "specifies every path variable as a required parameter" do
    document.fetch("paths").each do |path, methods|
      methods.each do |verb, operation|
        next unless %w[get post put patch delete].include?(verb)

        path.scan(/[{]([^}]+)[}]/).flatten.each do |name|
          expect(operation.fetch("parameters", [])).to include(
            a_hash_including("name" => name, "in" => "path", "required" => true)
          )
        end
      end
    end
  end

  it "does not expose generic JSON bodies with no documented fields" do
    document.fetch("paths").each do |path, methods|
      methods.each do |verb, operation|
        next unless %w[post put patch].include?(verb)

        schema = operation.dig("requestBody", "content", "application/json", "schema")
        next unless schema && !schema.key?("$ref")

        expect(schema.fetch("properties", {})).not_to be_empty,
          "Missing request properties at #{verb.upcase} #{path}"
      end
    end
  end
end
