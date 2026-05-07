# frozen_string_literal: true

module MentorSessions
  # Reschedules an existing MentorSession to a new starts_at time.
  #
  # Authorization: only the assigned mentor or the mentee may reschedule.
  # Status guard: only `scheduled` and `confirmed` sessions are reschedulable
  # (completed/cancelled sessions are immutable in time).
  # Advance-notice: same `mentor.min_advance_hours` rule as new bookings.
  #
  # On success, the session reverts to `:scheduled` (the mentor must
  # re-confirm via #36 since it's effectively a new time slot). The Google
  # Calendar invite + Meet link are recreated by the Calendar::SyncJob
  # (Epic 5) on the after_update_commit callback (out of scope here).
  class RescheduleService
    Result = Struct.new(:success?, :session, :error, keyword_init: true)

    def initialize(session:, actor:, new_starts_at:, duration_minutes: nil)
      @session = session
      @actor = actor
      @new_starts_at = new_starts_at
      @new_duration_minutes = duration_minutes || @session.duration_minutes
    end

    def call
      authorize!
      raise ArgumentError, "Session is not reschedulable in current state" unless reschedulable?
      raise ArgumentError, "New time too soon (mentor requires #{@session.mentor.min_advance_hours}h advance notice)" if too_soon?

      MentorSession.transaction do
        ActiveRecord::Base.connection.execute(
          "SELECT pg_advisory_xact_lock(hashtext('mentor:#{@session.mentor_id}'))"
        )
        @session.update!(
          starts_at: @new_starts_at,
          ends_at: @new_starts_at + @new_duration_minutes.minutes,
          duration_minutes: @new_duration_minutes,
          status: :scheduled,
          confirmed_by_mentor: false,
          confirmed_at: nil
        )
      end
      Calendar::UpdateEventJob.perform_later(@session.id, action: :update)
      Result.new(success?: true, session: @session)
    rescue ArgumentError, ActiveRecord::RecordInvalid, ActiveRecord::StatementInvalid => e
      Result.new(success?: false, error: e.message)
    end

    private

    def authorize!
      is_mentor = @session.mentor.user_id == @actor.id
      is_mentee = @session.mentee_user_id == @actor.id
      raise ArgumentError, "Only the assigned mentor or mentee can reschedule" unless is_mentor || is_mentee
    end

    def reschedulable?
      @session.status_scheduled? || @session.status_confirmed?
    end

    def too_soon?
      @new_starts_at < (Time.current + @session.mentor.min_advance_hours.hours)
    end
  end
end
