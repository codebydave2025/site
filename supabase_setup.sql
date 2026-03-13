-- RUN THIS IN SUPABASE SQL EDITOR

-- Create a table to store our application data
CREATE TABLE IF NOT EXISTS app_data (
  id TEXT PRIMARY KEY,
  content JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone with the anon key to read/write 
-- (You should restrict this later for better security!)
CREATE POLICY "Allow all access to app_data" 
ON app_data FOR ALL 
USING (true) 
WITH CHECK (true);

-- Initial empty arrays for our "files"
INSERT INTO app_data (id, content) VALUES 
('orders.json', '[]'),
('users.json', '[]'),
('employees.json', '[]'),
('reviews.json', '[]'),
('settings.json', '{}'),
('menu.json', '[]')
ON CONFLICT (id) DO NOTHING;
