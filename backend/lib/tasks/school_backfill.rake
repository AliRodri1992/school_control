namespace :school do
  desc "Backfill legacy school addresses, phones and student contacts into polymorphic tables"
  task backfill_polymorphic: :environment do
    result = LegacySchoolDataBackfill.new.call
    puts "[SCHOOL][BACKFILL] #{result.inspect}"
    puts "[SCHOOL][BACKFILL] Legacy records were retained. Review unnormalized phone numbers before retiring the old tables."
  end
end
