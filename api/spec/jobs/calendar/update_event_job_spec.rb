require "rails_helper"

RSpec.describe Calendar::UpdateEventJob do
  let(:team) { create(:team) }

  it "no-ops if google_event_id is blank" do
    session = ActsAsTenant.with_tenant(team) { create(:mentor_session, google_event_id: nil) }
    expect(GoogleCalendarToken).not_to receive(:user_tokens)
    described_class.new.perform(session.id, action: :update)
  end

  it "no-ops if no token is available" do
    session = ActsAsTenant.with_tenant(team) { create(:mentor_session, google_event_id: "evt_123") }
    expect { described_class.new.perform(session.id, action: :delete) }.not_to raise_error
  end
end
