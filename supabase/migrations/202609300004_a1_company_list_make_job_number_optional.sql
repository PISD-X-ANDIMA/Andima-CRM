-- Company creation in A1 does not create a job. Job lifecycle belongs to A3,
-- so a customer row may legitimately have no job_number yet.
ALTER TABLE public.a1_company_list
  ALTER COLUMN job_number DROP NOT NULL;
