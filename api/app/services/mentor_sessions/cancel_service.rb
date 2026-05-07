module MentorSessions
  class CancelService
    Result = Struct.new(:success?, :session, :error, keyword_init: true)

    def initialize(session:, actor:, reason: nil)
      @session = session
      @actor   = actor
      @reason  = reason
    end

    def call
      authorize!
      raise ArgumentError, "Cannot cancel a completed session" if @session.status_completed?

      @session.update!(
        status:              :cancelled,
        cancelled_at:        Time.current,
        cancelled_by_id:     @actor.id,
        cancellation_reason: @reason
      )
      dispatch_cancellation_email
      Calendar::UpdateEventJob.perform_later(@session.id, action: :delete)
      Result.new(success?: true, session: @session)
    rescue ArgumentError, ActiveRecord::RecordInvalid => e
      Result.new(success?: false, error: e.message)
    end

    private

    def authorize!
      is_mentor = @session.mentor.user_id == @actor.id
      is_mentee = @session.mentee_user_id == @actor.id
      raise ArgumentError, "Only mentor or mentee can cancel" unless is_mentor || is_mentee
    end

    def dispatch_cancellation_email
      if @session.mentor.user_id == @actor.id
        CancellationMailer.cancelled_by_mentor(@session.id).deliver_later
      else
        CancellationMailer.cancelled_by_mentee(@session.id).deliver_later
      end
    end
  end
end
