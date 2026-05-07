module Calendar
  class UpdateEventJob < ApplicationJob
    queue_as :default

    # action: :update | :delete
    def perform(mentor_session_id, action: :update)
      session = MentorSession.find(mentor_session_id)
      return if session.google_event_id.blank?

      ActsAsTenant.with_tenant(session.team) do
        token = best_token_for(session) or return
        Calendar::TokenRefresher.call(token)
        client = build_client(token)

        case action.to_sym
        when :delete
          client.delete_event(token.calendar_id, session.google_event_id, send_updates: "all")
          session.update_columns(google_event_id: nil)
        else
          ev = client.get_event(token.calendar_id, session.google_event_id)
          ev.start = Google::Apis::CalendarV3::EventDateTime.new(date_time: session.starts_at.iso8601, time_zone: "America/Sao_Paulo")
          ev.end   = Google::Apis::CalendarV3::EventDateTime.new(date_time: session.ends_at.iso8601,   time_zone: "America/Sao_Paulo")
          ev.summary = "Mentoria: #{session.mentor.name} ↔ #{session.mentee.name}"
          client.update_event(token.calendar_id, session.google_event_id, ev, send_updates: "all")
        end
      end
    end

    private

    def best_token_for(session)
      GoogleCalendarToken.user_tokens.find_by(user: session.mentor.user) ||
        GoogleCalendarToken.orchestrator_tokens.first
    end

    def build_client(token)
      service = Google::Apis::CalendarV3::CalendarService.new
      service.authorization = Signet::OAuth2::Client.new(
        access_token: token.access_token_ciphertext,
        refresh_token: token.refresh_token_ciphertext,
        token_credential_uri: "https://oauth2.googleapis.com/token",
        client_id:     ENV.fetch("GOOGLE_OAUTH_CLIENT_ID"),
        client_secret: ENV.fetch("GOOGLE_OAUTH_CLIENT_SECRET"),
        expires_at: token.expires_at
      )
      service
    end
  end
end
