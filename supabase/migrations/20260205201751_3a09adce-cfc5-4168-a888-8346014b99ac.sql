
-- Insert tags for existing mentors
-- Lana Bolotare = Finanças Corporativas
INSERT INTO public.mentor_tags (mentor_id, tag_id) VALUES 
('e2494aee-9f97-43b0-b5a1-60a280c22402', '3089cf05-18fb-4d85-a0c8-20e52ea87943')
ON CONFLICT DO NOTHING;

-- Rodrigo Vianna = Gestão de Pessoas (RH), Processos Seletivos (Orientação Profissional)
INSERT INTO public.mentor_tags (mentor_id, tag_id) VALUES 
('ec506a77-2aeb-4983-8e1b-b202bc56e4c1', '5bd68403-798f-4172-92f9-efcb192e2feb'),
('ec506a77-2aeb-4983-8e1b-b202bc56e4c1', 'ffb00e1b-e937-4209-bf9c-d474d7a8cade')
ON CONFLICT DO NOTHING;

-- Milena Magalhães = Recrutamento e Seleção
INSERT INTO public.mentor_tags (mentor_id, tag_id) VALUES 
('0f109554-f8f0-4f63-9648-5323573073ab', 'c4666dcb-b1e9-45aa-9c48-93b896cbab81')
ON CONFLICT DO NOTHING;
