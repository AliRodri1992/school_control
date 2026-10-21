FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "person#{n}@school.test" }
    name { "Persona de prueba" }
    role { "guardian" }
    password { "School-test-password-26" }
  end
  factory :academic_year do
    sequence(:name) { |n| "Ciclo #{n}" }
    starts_on { Date.current.beginning_of_year }
    ends_on { Date.current.end_of_year }
    admissions_open_on { Date.current - 30 }
    admissions_close_on { Date.current + 30 }
    reenrollment_open_on { Date.current - 30 }
    reenrollment_close_on { Date.current + 30 }
  end
  factory :group do
    academic_year
    grade_level { 1 }
    section { "A" }
    capacity { 30 }
  end
  factory :student do
    association :guardian, factory: :user
    first_name { "Alex" }
    last_name { "Ejemplo" }
    sequence(:curp) { |n| "DEMO#{format('%06d', n)}HDFRNN01" }
    birth_date { Date.new(2020, 1, 1) }
  end
  factory :admission do
    student
    academic_year
    grade_level { 1 }
    kind { "new" }
  end
  factory :enrollment do
    admission
    student { admission.student }
    academic_year { admission.academic_year }
    group { association(:group, academic_year: academic_year) }
  end
  factory :subject do
    sequence(:name) { |n| "Materia #{n}" }
    sequence(:code) { |n| "MAT#{n}" }
  end
  factory :course do
    group
    subject
    association :teacher, factory: :user, role: "teacher"
    weekly_periods { 3 }
  end
  factory :schedule_slot do
    course
    weekday { 1 }
    starts_minute { 480 }
    ends_minute { 530 }
    room { "Aula 1A" }
  end
end
