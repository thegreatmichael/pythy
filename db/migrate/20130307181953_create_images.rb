class CreateImages < ActiveRecord::Migration
  def change
    create_table :images do |t|
      t.references :user
      t.string :name
      t.string :filename
      t.timestamps
    end
  end
end
