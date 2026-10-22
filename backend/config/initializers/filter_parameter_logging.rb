Rails.application.config.filter_parameters += %i[password password_confirmation token curp birth_date address phone medical_notes]

Rails.application.config.filter_parameters += %i[body subject relationship emergency_phone]
