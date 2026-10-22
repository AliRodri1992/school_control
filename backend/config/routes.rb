Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check
  namespace :api do
    get "session", to: "sessions#show"
    post "session", to: "sessions#create"
    delete "session", to: "sessions#destroy"
    post "registration", to: "sessions#register"
    resource :school, only: %i[show update]
    resources :student_contacts, only: %i[index create update destroy]
    resources :messages, only: %i[index create] do
      get :recipients, on: :collection
      post :read, on: :member
    end
    resources :users, only: %i[index create update]
    resources :academic_years, only: %i[index create update]
    resources :groups, only: %i[index create update] do
      post :generate_schedule, on: :member
    end
    resources :subjects, only: %i[index create update]
    resources :courses, only: %i[index create update]
    resources :schedule_slots, only: %i[index create destroy]
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
    resources :grades, only: %i[index create]
    resources :calendar_events, only: %i[index create update destroy]
    resources :announcements, only: %i[index create destroy]
    resource :dashboard_preference, only: %i[show update]
    get "dashboard", to: "dashboard#show"
  end
end
