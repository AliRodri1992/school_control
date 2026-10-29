class AddApplicantIdentityFields < ActiveRecord::Migration[8.1]
  def change
    change_table :students, bulk: true do |t|
      t.string :second_last_name
      t.string :birth_place
      t.string :birth_state
      t.string :nationality
      t.string :sex
    end
  end
end
