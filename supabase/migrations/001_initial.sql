-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  format TEXT NOT NULL,
  player_type TEXT NOT NULL DEFAULT 'individual',
  status TEXT NOT NULL DEFAULT 'draft',
  venue TEXT,
  description TEXT,
  max_participants INTEGER NOT NULL DEFAULT 32,
  start_date TEXT NOT NULL,
  end_date TEXT,
  duration_hours NUMERIC(4,1),
  registered_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  max_players INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX idx_events_organization_id ON events(organization_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_sessions_event_id ON sessions(event_id);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_teams_session_id ON teams(session_id);
CREATE INDEX idx_participants_session_id ON participants(session_id);
CREATE INDEX idx_participants_team_id ON participants(team_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own organization"
  ON organizations FOR UPDATE
  USING (id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

-- Profiles policies
CREATE POLICY "Users can view profiles in their organization"
  ON profiles FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Events policies
CREATE POLICY "Users can view events in their organization"
  ON events FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create events in their organization"
  ON events FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update events in their organization"
  ON events FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete events in their organization"
  ON events FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

-- Sessions policies
CREATE POLICY "Users can view sessions for events in their organization"
  ON sessions FOR SELECT
  USING (event_id IN (
    SELECT id FROM events WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can create sessions for events in their organization"
  ON sessions FOR INSERT
  WITH CHECK (event_id IN (
    SELECT id FROM events WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can update sessions for events in their organization"
  ON sessions FOR UPDATE
  USING (event_id IN (
    SELECT id FROM events WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete sessions for events in their organization"
  ON sessions FOR DELETE
  USING (event_id IN (
    SELECT id FROM events WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

-- Teams policies
CREATE POLICY "Users can view teams for sessions in their organization"
  ON teams FOR SELECT
  USING (session_id IN (
    SELECT id FROM sessions WHERE event_id IN (
      SELECT id FROM events WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can create teams for sessions in their organization"
  ON teams FOR INSERT
  WITH CHECK (session_id IN (
    SELECT id FROM sessions WHERE event_id IN (
      SELECT id FROM events WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can update teams for sessions in their organization"
  ON teams FOR UPDATE
  USING (session_id IN (
    SELECT id FROM sessions WHERE event_id IN (
      SELECT id FROM events WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can delete teams for sessions in their organization"
  ON teams FOR DELETE
  USING (session_id IN (
    SELECT id FROM sessions WHERE event_id IN (
      SELECT id FROM events WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  ));

-- Participants policies
CREATE POLICY "Users can view participants for sessions in their organization"
  ON participants FOR SELECT
  USING (session_id IN (
    SELECT id FROM sessions WHERE event_id IN (
      SELECT id FROM events WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can create participants for sessions in their organization"
  ON participants FOR INSERT
  WITH CHECK (session_id IN (
    SELECT id FROM sessions WHERE event_id IN (
      SELECT id FROM events WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can update participants for sessions in their organization"
  ON participants FOR UPDATE
  USING (session_id IN (
    SELECT id FROM sessions WHERE event_id IN (
      SELECT id FROM events WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can delete participants for sessions in their organization"
  ON participants FOR DELETE
  USING (session_id IN (
    SELECT id FROM sessions WHERE event_id IN (
      SELECT id FROM events WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  ));

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at on all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
