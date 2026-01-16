-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'content',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- System/service role can insert notifications for any user
CREATE POLICY "Service can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to notify users about new content
CREATE OR REPLACE FUNCTION public.notify_users_new_content()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT 
    p.user_id,
    'Novo conteúdo disponível! 📚',
    'Confira: ' || NEW.title,
    'content'
  FROM public.profiles p;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create notifications when new content is added
CREATE TRIGGER on_new_content_notify_users
AFTER INSERT ON public.content_items
FOR EACH ROW
EXECUTE FUNCTION public.notify_users_new_content();

-- Create function to notify mentors about new mentorship requests
CREATE OR REPLACE FUNCTION public.notify_mentor_new_session()
RETURNS TRIGGER AS $$
DECLARE
  mentor_email TEXT;
  mentor_user_id UUID;
BEGIN
  -- Get the mentor's email
  SELECT email INTO mentor_email FROM public.mentors WHERE id = NEW.mentor_id;
  
  -- Try to find a user with this email (if mentor has an account)
  SELECT id INTO mentor_user_id FROM auth.users WHERE email = mentor_email;
  
  IF mentor_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      mentor_user_id,
      'Nova solicitação de mentoria! 🎯',
      'Você recebeu uma nova solicitação de mentoria.',
      'mentorship_request'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to notify mentors when new sessions are scheduled
CREATE TRIGGER on_new_session_notify_mentor
AFTER INSERT ON public.mentor_sessions
FOR EACH ROW
EXECUTE FUNCTION public.notify_mentor_new_session();