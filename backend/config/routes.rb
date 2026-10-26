Rails.application.routes.draw do
  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?
  get "up" => "rails/health#show", as: :rails_health_check
  namespace :api do
    get "docs", to: "docs#show"
    resources :languages, only: %i[index create update] do
      get :bundle, on: :member
    end
    resources :translation_entries, only: %i[index create update]
    get "session", to: "sessions#show"
    post "session", to: "sessions#create"
    post "session/verify_otp", to: "sessions#verify_otp"
    delete "session", to: "sessions#destroy"
    post "registration", to: "sessions#register"
    resource :school, only: %i[show update]
    resource :password_reset, only: %i[create update]
    resource :preferences, only: %i[show update]
    resource :profile, only: %i[show update] do
      get :avatar, to: "profiles#avatar"
      post :avatar, to: "profiles#upload_avatar"
      delete :avatar, to: "profiles#remove_avatar"
      post :request_email_change, path: "email_change", to: "profiles#request_email_change"
      post :confirm_email_change, path: "email_change/confirm", to: "profiles#confirm_email_change"
      patch :password, to: "account_security#update"
      delete :sessions, to: "account_security#destroy"
      get :devices, to: "account_security#devices"
      delete "devices/:id", to: "account_security#revoke_device"
      get :two_factor, to: "two_factor#show"
      post "two_factor/setup", to: "two_factor#setup"
      post "two_factor/confirm", to: "two_factor#confirm"
      delete :two_factor, to: "two_factor#destroy"
    end
    resources :email_templates, only: %i[index create update]
    resources :import_mapping_templates, only: %i[index create destroy]
    resources :data_imports, only: %i[index create show] do
      get :preview, on: :member
      post :validate, on: :member
      post :execute, on: :member
      post :retry, on: :member
    end
    resources :notifications, only: :index do
      post :read, on: :member
      post :read_all, on: :collection
    end
    resources :assignments, only: %i[index create update] do
      get :submissions, on: :member
      post :submit, on: :member
      post :review, on: :member
    end
    resources :student_documents, only: %i[index create] do
      get :download, on: :member
      post :review, on: :member
    end
    resources :student_contacts, only: %i[index create update destroy]
    resources :messages, only: %i[index create] do
      get :recipients, on: :collection
      post :read, on: :member
    end
    resources :reports, only: %i[index create show] do
      get :preview, on: :collection
      get :download, on: :member
    end
    resources :access_roles, only: %i[index create update] do
      post :assign, on: :collection
    end
    resources :users, only: %i[index create update]
    resources :academic_years, only: %i[index create update]
    resources :groups, only: %i[index create update] do
      post :generate_schedule, on: :member
    end
    resources :subjects, only: %i[index create update]
    resources :courses, only: %i[index create update]
    resources :schedule_slots, only: %i[index create destroy]
    get "students/:student_id/details/:kind", to: "student_details#index"
    post "students/:student_id/details/:kind", to: "student_details#create"
    patch "students/:student_id/details/:kind/:id", to: "student_details#update"
    delete "students/:student_id/details/:kind/:id", to: "student_details#destroy"
    resources :students, only: %i[index show create update] do
      get :report, on: :member
    end
    resources :admissions, only: %i[index create] do
      post :approve, on: :member
      post :reject, on: :member
    end
    resources :enrollments, only: %i[index] do
      post :complete, on: :member
    end
    resources :attendances, only: %i[index create]
    resources :grades, only: %i[index create] do
      post :review, on: :member
      post :publish, on: :member
      post :correct, on: :member
      get :history, on: :member
      resources :change_requests, controller: "grade_change_requests", only: %i[index create] do
        post :resolve, on: :member
      end
    end
    resources :calendar_events, only: %i[index create update destroy]
    resources :announcements, only: %i[index create destroy]
    resource :dashboard_preference, only: %i[show update]
    get "dashboard", to: "dashboard#show"
  end
end
