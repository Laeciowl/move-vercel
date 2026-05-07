class AutoCancelUnreconfirmedService
  WINDOW = 3.hours

  def self.call
    ActsAsTenant.without_tenant do
      MentorSession.includes(:mentor, :mentee, :team).status_scheduled.where(
        reconfirmation_confirmed_at: nil,
        starts_at: Time.current..(Time.current + WINDOW)
      ).find_each do |session|
        ActsAsTenant.with_tenant(session.team) do
          new(session).call
        end
      end
    end
  end

  def initialize(session)
    @session = session
  end

  def call
    return if @session.reconfirmation_confirmed_at.present?
    return unless @session.status_scheduled?

    @session.update_columns(
      status: MentorSession.statuses[:cancelled],
      cancellation_reason: "auto_cancel_no_reconfirm",
      cancelled_at: Time.current
    )
    notify_mentor
    Calendar::UpdateEventJob.perform_later(@session.id, action: :delete)
  end

  private

  def notify_mentor
    NotificationMailer.session_auto_cancelled(@session.id).deliver_later if defined?(NotificationMailer)
  rescue NameError
    nil
  end
end
