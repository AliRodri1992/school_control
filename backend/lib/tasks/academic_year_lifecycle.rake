namespace :school do
  namespace :lifecycle do
    desc "Validate and advance school-year statuses (also used for manual recovery)"
    task advance: :environment do
      AcademicYearLifecycle.run_all!
      puts "Evaluación de ciclos escolares completada."
    end
  end
end
