-- Supabase Database Schema for Career Boost AI

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create tables
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skills TEXT[] DEFAULT '{}',
  resume_text TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  description TEXT NOT NULL,
  location TEXT,
  type TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Jobs table is public for reading
CREATE POLICY "Anyone can view jobs" ON jobs
  FOR SELECT USING (true);

-- Insert sample jobs
INSERT INTO jobs (title, company, required_skills, description, location, type, url) VALUES
('Frontend Developer', 'TechCorp Inc.', '{"React", "TypeScript", "CSS", "HTML", "JavaScript"}', 'Build modern web applications using React and TypeScript. Work with a team of designers and backend developers to create exceptional user experiences.', 'Remote', 'Full-time', 'https://example.com/job/1'),
('Full Stack Developer', 'StartupXYZ', '{"React", "Node.js", "Express", "MongoDB", "JavaScript"}', 'Develop both frontend and backend components for our SaaS platform. You will work on everything from user interfaces to API development.', 'San Francisco, CA', 'Full-time', 'https://example.com/job/2'),
('Data Analyst', 'DataDriven Co.', '{"Python", "Pandas", "SQL", "Tableau", "Excel"}', 'Analyze large datasets to provide insights for business decisions. Create visualizations and reports for stakeholders.', 'New York, NY', 'Full-time', 'https://example.com/job/3'),
('DevOps Engineer', 'CloudTech Solutions', '{"AWS", "Docker", "Kubernetes", "Jenkins", "Terraform"}', 'Manage cloud infrastructure and CI/CD pipelines. Ensure high availability and scalability of our applications.', 'Remote', 'Full-time', 'https://example.com/job/4'),
('Mobile App Developer', 'AppWorks', '{"React Native", "JavaScript", "iOS", "Android", "Firebase"}', 'Develop cross-platform mobile applications using React Native. Work on both iOS and Android platforms.', 'Austin, TX', 'Full-time', 'https://example.com/job/5'),
('Backend Developer', 'ServerSide Ltd.', '{"Node.js", "Express", "PostgreSQL", "Redis", "GraphQL"}', 'Build robust backend services and APIs. Optimize database queries and implement caching strategies.', 'Remote', 'Full-time', 'https://example.com/job/6'),
('Machine Learning Engineer', 'AI Innovations', '{"Python", "TensorFlow", "Scikit-learn", "Pandas", "Jupyter"}', 'Develop and deploy machine learning models. Work with large datasets and implement AI solutions.', 'Seattle, WA', 'Full-time', 'https://example.com/job/7'),
('UI/UX Developer', 'DesignTech', '{"React", "CSS", "Figma", "Tailwind CSS", "JavaScript"}', 'Create beautiful and functional user interfaces. Collaborate closely with designers to implement pixel-perfect designs.', 'Los Angeles, CA', 'Full-time', 'https://example.com/job/8'),
('Software Engineer Intern', 'BigTech Corp', '{"JavaScript", "Python", "Git", "SQL", "Agile"}', 'Join our engineering team as an intern. Work on real projects and learn from experienced developers.', 'Mountain View, CA', 'Internship', 'https://example.com/job/9'),
('Cloud Architect', 'CloudMasters', '{"AWS", "Azure", "Terraform", "Docker", "Kubernetes"}', 'Design and implement cloud infrastructure solutions. Lead migration projects and optimize cloud costs.', 'Remote', 'Full-time', 'https://example.com/job/10'),
('QA Engineer', 'QualityFirst Inc.', '{"Selenium", "JavaScript", "Jest", "Cypress", "Git"}', 'Ensure software quality through automated testing. Write test scripts and maintain testing frameworks.', 'Chicago, IL', 'Full-time', 'https://example.com/job/11'),
('Product Manager', 'ProductVision', '{"Agile", "Scrum", "SQL", "Analytics", "Communication"}', 'Drive product development from ideation to launch. Work with cross-functional teams to deliver value to users.', 'Boston, MA', 'Full-time', 'https://example.com/job/12'),
('Senior Frontend Developer', 'TechGiant', '{"React", "TypeScript", "Next.js", "GraphQL", "CSS"}', 'Lead frontend development for our flagship product. Mentor junior developers and drive technical decisions.', 'Remote', 'Full-time', 'https://example.com/job/13'),
('Data Scientist', 'DataLabs', '{"Python", "R", "Machine Learning", "Statistics", "SQL"}', 'Build predictive models and analyze complex datasets. Present findings to executive team.', 'San Francisco, CA', 'Full-time', 'https://example.com/job/14'),
('Security Engineer', 'SecureNet', '{"Python", "Security", "AWS", "Docker", "Kubernetes"}', 'Implement security measures and conduct vulnerability assessments. Ensure compliance with industry standards.', 'Washington, DC', 'Full-time', 'https://example.com/job/15'),
('Blockchain Developer', 'CryptoTech', '{"Solidity", "Ethereum", "Web3", "JavaScript", "Smart Contracts"}', 'Develop decentralized applications and smart contracts. Work on cutting-edge blockchain technology.', 'Remote', 'Full-time', 'https://example.com/job/16'),
('Systems Administrator', 'InfraCorp', '{"Linux", "Bash", "AWS", "Docker", "Monitoring"}', 'Manage and maintain IT infrastructure. Ensure system reliability and implement automation solutions.', 'Denver, CO', 'Full-time', 'https://example.com/job/17'),
('Game Developer', 'GameStudio', '{"Unity", "C#", "3D Modeling", "Game Design", "Unreal Engine"}', 'Create engaging video games for multiple platforms. Work with artists and designers on game mechanics.', 'Los Angeles, CA', 'Full-time', 'https://example.com/job/18'),
('Technical Writer', 'DocuTech', '{"Technical Writing", "Documentation", "API", "Markdown", "Git"}', 'Create comprehensive technical documentation. Work closely with engineering teams to document APIs and systems.', 'Remote', 'Full-time', 'https://example.com/job/19'),
('Database Administrator', 'DataCore', '{"PostgreSQL", "MySQL", "MongoDB", "SQL", "Performance Tuning"}', 'Manage and optimize database systems. Ensure data integrity and implement backup strategies.', 'Phoenix, AZ', 'Full-time', 'https://example.com/job/20');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
CREATE INDEX IF NOT EXISTS idx_jobs_required_skills ON jobs USING GIN(required_skills);