Rails.application.config.session_store :cookie_store, key: "_school_control", same_site: :lax, secure: Rails.env.production? || Rails.env.staging?, expire_after: 8.hours
