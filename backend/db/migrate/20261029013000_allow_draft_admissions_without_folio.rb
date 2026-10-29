class AllowDraftAdmissionsWithoutFolio < ActiveRecord::Migration[8.1]
  def up
    change_column_null :admissions, :folio, true
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Draft admissions may have no folio" if
      Admission.where(folio: nil).exists?
    change_column_null :admissions, :folio, false
  end
end
