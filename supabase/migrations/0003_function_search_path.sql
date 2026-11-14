-- Pin search_path on our functions (Supabase advisor 0011_function_search_path_mutable).
-- public holds both our tables and the vector extension's operators.
alter function match_chunks(vector, int, float) set search_path = public;
alter function search_chunks_fts(text, int) set search_path = public;
alter function hit_rate_limit(text, text, timestamptz) set search_path = public;
