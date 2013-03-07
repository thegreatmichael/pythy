class Image < ActiveRecord::Base
  attr_accessible :name, :filename, :user_id, :remote_filename_url
    mount_uploader :filename, ImageUploader

end
