class ExtendAdmissionLifecycle < ActiveRecord::Migration[8.1]
  STATUSES = %w[draft submitted correction_requested approved rejected cancelled].freeze

  def up
    connection.check_constraints(:admissions).each do |constraint|
      remove_check_constraint :admissions, name: constraint.name if constraint.expression.include?("status")
    end
    add_check_constraint :admissions, "status IN ('draft','submitted','correction_requested','approved','rejected','cancelled')", name: "admissions_lifecycle_status"
    add_index :admissions, :status
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Historical admission statuses cannot be safely discarded"
  end
end
