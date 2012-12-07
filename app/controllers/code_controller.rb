class CodeController < ApplicationController

	def test
		test2

		# system 'echo python'

		# Move into queue for processing in the background
		# self.send_later(:deliver)

		# with delayed_job
		# @user.delay.activate!(@device)

		# Delayed::Job.enqueue(MailingJob.new(params[:id]))
		flash[:alert] = "Mailing delivered"
	end
	
	# 5.minutes.from_now will be evaluated when in_the_future is called
  	# handle_asynchronously :in_the_future, :run_at => Proc.new { 5.minutes.from_now }

  	def test2
  		puts "code_controller.rb"
  	end
  	handle_asynchronously :test2
end
