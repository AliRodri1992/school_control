class UserLoginSession < ApplicationRecord
  belongs_to :user
  validates :token_digest, presence: true, uniqueness: true

  scope :active, -> { where(revoked_at: nil) }

  def self.issue!(user:, session:, request:)
    token = SecureRandom.urlsafe_base64(32)
    record = create!(
      user: user, token_digest: Digest::SHA256.hexdigest(token),
      user_agent: request.user_agent.to_s.truncate(255), last_seen_at: Time.current
    )
    session[:user_id] = user.id
    session[:session_version] = user.session_version
    session[:login_token] = token
    record
  end

  def self.for_token(token)
    return if token.blank?
    active.find_by(token_digest: Digest::SHA256.hexdigest(token))
  end

  def browser_label
    agent = user_agent.to_s
    browser = if agent.include?("Edg/")
      "Edge"
    elsif agent.include?("Firefox/")
      "Firefox"
    elsif agent.include?("Chrome/")
      "Chrome"
    elsif agent.include?("Safari/")
      "Safari"
    else
      "Navegador"
    end
    device = if agent.include?("iPhone")
      "iPhone"
    elsif agent.include?("Android")
      "Android"
    elsif agent.include?("Macintosh")
      "macOS"
    elsif agent.include?("Windows")
      "Windows"
    else
      "Dispositivo"
    end
    "#{browser} · #{device}"
  end
end
