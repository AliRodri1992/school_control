class CreateDataImportItems < ActiveRecord::Migration[8.1]
  def change
    create_table :data_import_items do |t|
      t.references :data_import, null: false, foreign_key: true
      t.integer :row_number, null: false
      t.string :record_type, null: false
      t.bigint :record_id, null: false
      t.timestamps
    end
    add_index :data_import_items, %i[data_import_id row_number], unique: true,
      name: "unique_import_record_per_row"
  end
end
