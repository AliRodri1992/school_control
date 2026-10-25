require "rails_helper"

RSpec.describe "institutional email templates", type: :request do
  def sign_in(account)
    post "/api/session", params: {
      email: account.email, password: "School-test-password-26"
    }, as: :json
  end

  def template_attributes(key: "welcome", locale: "es")
    {
      key: key, locale: locale, status: "draft",
      subject: "Bienvenido a nuestra escuela",
      heading: "Una comunidad que aprende",
      body: "Tu cuenta está lista.",
      html_body: "<p>Tu cuenta está lista.</p>",
      footer: "Comunidad escolar", accent_color: "#405CF5"
    }
  end

  it "returns JSON ordered by notification type and language for an administrator" do
    EmailTemplate.create!(template_attributes(key: "welcome", locale: "en"))
    EmailTemplate.create!(template_attributes(key: "welcome", locale: "es"))
    EmailTemplate.activity.save!

    sign_in(create(:user, role: "admin"))
    get "/api/email_templates", as: :json

    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("application/json")
    expect(response.parsed_body.pluck("key", "locale")).to eq([
      [ "activity", "es" ], [ "welcome", "en" ], [ "welcome", "es" ]
    ])
  end

  it "creates and revises a template with an accessible version snapshot" do
    sign_in(create(:user, role: "admin"))
    post "/api/email_templates", params: template_attributes, as: :json

    expect(response).to have_http_status(:created)
    id = response.parsed_body.fetch("id")
    expect(response.parsed_body.fetch("revision")).to eq(1)

    patch "/api/email_templates/#{id}", params: { heading: "Nuevo encabezado" }, as: :json
    expect(response).to have_http_status(:ok)

    saved = EmailTemplate.find(id)
    expect(saved.heading).to eq("Nuevo encabezado")
    expect(saved.revision).to eq(2)
    expect(saved.email_template_versions.first.snapshot.fetch("heading")).to eq("Una comunidad que aprende")
  end

  it "rejects listing, creation and changes from a parent account" do
    template = EmailTemplate.activity
    template.save!
    sign_in(create(:user, role: "guardian"))

    get "/api/email_templates", as: :json
    expect(response).to have_http_status(:forbidden)

    post "/api/email_templates", params: template_attributes, as: :json
    expect(response).to have_http_status(:forbidden)

    patch "/api/email_templates/#{template.id}", params: { heading: "No autorizado" }, as: :json
    expect(response).to have_http_status(:forbidden)
    expect(template.reload.heading).not_to eq("No autorizado")
  end
end
