-- Create a view for mentor_sessions with names for admin visibility in Cloud view
CREATE OR REPLACE VIEW public.mentor_sessions_with_names AS
SELECT 
  ms.id,
  ms.mentor_id,
  m.name as mentor_name,
  ms.user_id,
  p.name as mentee_name,
  ms.scheduled_at,
  ms.status,
  ms.duration,
  ms.mentee_formation,
  ms.mentee_objective,
  ms.mentor_notes,
  ms.notes,
  ms.confirmed_by_mentor,
  ms.confirmed_at,
  ms.completed_at,
  ms.created_at
FROM public.mentor_sessions ms
LEFT JOIN public.mentors m ON ms.mentor_id = m.id
LEFT JOIN public.profiles p ON ms.user_id = p.user_id;

-- Grant access to authenticated users (RLS will still apply on base tables)
GRANT SELECT ON public.mentor_sessions_with_names TO authenticated;