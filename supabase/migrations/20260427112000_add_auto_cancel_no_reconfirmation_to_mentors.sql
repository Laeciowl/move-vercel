alter table public.mentors
add column if not exists auto_cancel_no_reconfirmation boolean not null default false;

comment on column public.mentors.auto_cancel_no_reconfirmation is
'Se TRUE, sessões sem reconfirmação do mentorado até 3h antes são canceladas automaticamente. Se FALSE (padrão), a sessão continua e o mentor recebe apenas aviso.';
