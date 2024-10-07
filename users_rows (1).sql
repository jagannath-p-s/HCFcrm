create table
  public.expenses (
    id serial not null,
    amount numeric not null,
    description text null,
    expense_date date not null,
    category_id integer null,
    staff_id integer null,
    created_at timestamp with time zone null,
    final_date_to_pay date null,
    status character varying not null,
    expense_type character varying not null,
    constraint expenses_pkey primary key (id)
  ) tablespace pg_default;

  