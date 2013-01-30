# =========================================================================
# TODO document
#
# A note about the difference between due_at and closes_at: An assignment
# can have neither, one, or both of these set. Here are the three
# possibilities:
#
# Neither due_at nor closes_at is set:
#   Students can update their code and run checks indefinitely.
#
# due_at is set but closes_at is not set, or
# due_at is not set but closes_at is set:
#   Students can update their code and run checks until
#   (due_at || closes_at); after this, they cannot update or check.
#
# Both due_at and closes_at are set:
#  Students can update their code and run checks until closes_at;
#  checks made after due_at may be subject to a grade penalty.
#
class AssignmentOffering < ActiveRecord::Base

  belongs_to  :assignment
  belongs_to  :course_offering

  has_many    :assignment_repositories

  accepts_nested_attributes_for :assignment

  attr_accessible :assignment_id, :assignment_attributes,
    :course_offering_id, :opens_at, :closes_at, :due_at


  # -------------------------------------------------------------
  def self.visible
    where('opens_at is not null && opens_at <= ?', Time.now)
  end


  # -------------------------------------------------------------
  def visible?
    opens_at && Time.now >= opens_at
  end


  # -------------------------------------------------------------
  def past_due?
    effectively_due_at && effectively_due_at < Time.now
  end


  # -------------------------------------------------------------
  def effectively_due_at
    due_at || closes_at
  end


  # -------------------------------------------------------------
  def closed?
    if closes_at
      closes_at < Time.now
    elsif due_at
      due_at < Time.now
    else
      false
    end
  end


  # -------------------------------------------------------------
  def repository_for_user(user)
    assignment_repositories.where(user_id: user.id).first
  end

end
