class PasswordRecoveryJob < ApplicationJob
  def perform(user_id, session_version)
    user = User.find_by(id: user_id, session_version: session_version, active: true)
    return unless user
    PasswordMailer.with(recipient: user).recovery.deliver_now
  end
end
