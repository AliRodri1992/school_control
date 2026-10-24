require "rails_helper"

RSpec.describe "API documentation endpoint", type: :request do
  it "requires authentication" do
    get "/api/docs"
    expect(response).to have_http_status(:unauthorized)
  end
end
