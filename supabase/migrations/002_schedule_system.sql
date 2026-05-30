-- ============================================================================
-- Migration 002: Schedule System - Remove Sessions, Add Match Schedule
-- ============================================================================

-- ─── Drop Session-Related Tables ─────────────────────────────────────────────

DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- ─── Create New Tables ───────────────────────────────────────────────────────

-- Courts table
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table (redesigned)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  player_count INTEGER NOT NULL DEFAULT 0,
  colour_hex TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  round_label TEXT NOT NULL,
  match_number_in_round INTEGER NOT NULL,
  home_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  away_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  home_score INTEGER,
  away_score INTEGER,
  winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  is_draw BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standings table (for League format)
CREATE TABLE standings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  played INTEGER NOT NULL DEFAULT 0,
  won INTEGER NOT NULL DEFAULT 0,
  drawn INTEGER NOT NULL DEFAULT 0,
  lost INTEGER NOT NULL DEFAULT 0,
  goals_for INTEGER NOT NULL DEFAULT 0,
  goals_against INTEGER NOT NULL DEFAULT 0,
  goal_difference INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, team_id)
);

-- Event format configuration table
CREATE TABLE event_format_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE UNIQUE,
  format TEXT NOT NULL CHECK (format IN ('tournament', 'league')),
  tournament_has_third_place BOOLEAN DEFAULT TRUE,
  tournament_total_rounds INTEGER,
  league_legs INTEGER DEFAULT 1,
  league_points_win INTEGER DEFAULT 3,
  league_points_draw INTEGER DEFAULT 1,
  league_points_loss INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Update Events Table ─────────────────────────────────────────────────────

-- Add new columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS courts_count INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS teams_count INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS players_per_team INTEGER;

-- Update format constraint to only allow tournament and league
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_format_check;
ALTER TABLE events ADD CONSTRAINT events_format_check CHECK (format IN ('tournament', 'league'));

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_courts_event_id ON courts(event_id);
CREATE INDEX idx_courts_organization_id ON courts(organization_id);

CREATE INDEX idx_teams_event_id ON teams(event_id);
CREATE INDEX idx_teams_organization_id ON teams(organization_id);

CREATE INDEX idx_matches_event_id ON matches(event_id);
CREATE INDEX idx_matches_organization_id ON matches(organization_id);
CREATE INDEX idx_matches_home_team_id ON matches(home_team_id);
CREATE INDEX idx_matches_away_team_id ON matches(away_team_id);
CREATE INDEX idx_matches_court_id ON matches(court_id);
CREATE INDEX idx_matches_scheduled_date ON matches(scheduled_date);
CREATE INDEX idx_matches_status ON matches(status);

CREATE INDEX idx_standings_event_id ON standings(event_id);
CREATE INDEX idx_standings_team_id ON standings(team_id);
CREATE INDEX idx_standings_position ON standings(position);

CREATE INDEX idx_event_format_config_event_id ON event_format_config(event_id);

-- ─── Row Level Security (RLS) ────────────────────────────────────────────────

ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_format_config ENABLE ROW LEVEL SECURITY;

-- Courts policies
CREATE POLICY "Users can view courts in their organization"
  ON courts FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create courts in their organization"
  ON courts FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update courts in their organization"
  ON courts FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete courts in their organization"
  ON courts FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

-- Teams policies
CREATE POLICY "Users can view teams in their organization"
  ON teams FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create teams in their organization"
  ON teams FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update teams in their organization"
  ON teams FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete teams in their organization"
  ON teams FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

-- Matches policies
CREATE POLICY "Users can view matches in their organization"
  ON matches FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create matches in their organization"
  ON matches FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update matches in their organization"
  ON matches FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete matches in their organization"
  ON matches FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

-- Standings policies
CREATE POLICY "Users can view standings in their organization"
  ON standings FOR SELECT
  USING (event_id IN (
    SELECT id FROM events WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can create standings in their organization"
  ON standings FOR INSERT
  WITH CHECK (event_id IN (
    SELECT id FROM events WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can update standings in their organization"
  ON standings FOR UPDATE
  USING (event_id IN (
    SELECT id FROM events WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete standings in their organization"
  ON standings FOR DELETE
  USING (event_id IN (
    SELECT id FROM events WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

-- Event format config policies
CREATE POLICY "Users can view event format config in their organization"
  ON event_format_config FOR SELECT
  USING (event_id IN (
    SELECT id FROM events WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can create event format config in their organization"
  ON event_format_config FOR INSERT
  WITH CHECK (event_id IN (
    SELECT id FROM events WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can update event format config in their organization"
  ON event_format_config FOR UPDATE
  USING (event_id IN (
    SELECT id FROM events WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete event format config in their organization"
  ON event_format_config FOR DELETE
  USING (event_id IN (
    SELECT id FROM events WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

-- ─── Triggers ────────────────────────────────────────────────────────────────

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON standings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Functions ───────────────────────────────────────────────────────────────

-- Function to recalculate standings for a league event
CREATE OR REPLACE FUNCTION recalculate_standings(p_event_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config RECORD;
  v_team RECORD;
  v_played INTEGER;
  v_won INTEGER;
  v_drawn INTEGER;
  v_lost INTEGER;
  v_goals_for INTEGER;
  v_goals_against INTEGER;
  v_goal_difference INTEGER;
  v_points INTEGER;
  v_position INTEGER;
BEGIN
  -- Get the league config
  SELECT league_points_win, league_points_draw, league_points_loss
  INTO v_config
  FROM event_format_config
  WHERE event_id = p_event_id AND format = 'league';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'League config not found for event %', p_event_id;
  END IF;

  -- Calculate stats for each team
  FOR v_team IN
    SELECT id FROM teams WHERE event_id = p_event_id ORDER BY name
  LOOP
    -- Count matches played
    SELECT COUNT(*)
    INTO v_played
    FROM matches
    WHERE event_id = p_event_id
      AND status = 'completed'
      AND (home_team_id = v_team.id OR away_team_id = v_team.id);

    -- Count wins
    SELECT COUNT(*)
    INTO v_won
    FROM matches
    WHERE event_id = p_event_id
      AND status = 'completed'
      AND winner_team_id = v_team.id
      AND is_draw = FALSE;

    -- Count draws
    SELECT COUNT(*)
    INTO v_drawn
    FROM matches
    WHERE event_id = p_event_id
      AND status = 'completed'
      AND is_draw = TRUE
      AND (home_team_id = v_team.id OR away_team_id = v_team.id);

    -- Count losses
    v_lost := v_played - v_won - v_drawn;

    -- Calculate goals for
    SELECT COALESCE(SUM(CASE WHEN home_team_id = v_team.id THEN home_score ELSE away_score END), 0)
    INTO v_goals_for
    FROM matches
    WHERE event_id = p_event_id
      AND status = 'completed'
      AND (home_team_id = v_team.id OR away_team_id = v_team.id);

    -- Calculate goals against
    SELECT COALESCE(SUM(CASE WHEN home_team_id = v_team.id THEN away_score ELSE home_score END), 0)
    INTO v_goals_against
    FROM matches
    WHERE event_id = p_event_id
      AND status = 'completed'
      AND (home_team_id = v_team.id OR away_team_id = v_team.id);

    -- Calculate goal difference
    v_goal_difference := v_goals_for - v_goals_against;

    -- Calculate points
    v_points := (v_won * v_config.league_points_win) + 
                (v_drawn * v_config.league_points_draw) + 
                (v_lost * v_config.league_points_loss);

    -- Upsert standings
    INSERT INTO standings (
      event_id, team_id, played, won, drawn, lost,
      goals_for, goals_against, goal_difference, points, position
    )
    VALUES (
      p_event_id, v_team.id, v_played, v_won, v_drawn, v_lost,
      v_goals_for, v_goals_against, v_goal_difference, v_points, 0
    )
    ON CONFLICT (event_id, team_id)
    DO UPDATE SET
      played = EXCLUDED.played,
      won = EXCLUDED.won,
      drawn = EXCLUDED.drawn,
      lost = EXCLUDED.lost,
      goals_for = EXCLUDED.goals_for,
      goals_against = EXCLUDED.goals_against,
      goal_difference = EXCLUDED.goal_difference,
      points = EXCLUDED.points,
      updated_at = NOW();
  END LOOP;

  -- Update positions based on points, then goal difference, then goals for
  v_position := 1;
  FOR v_team IN
    SELECT team_id
    FROM standings
    WHERE event_id = p_event_id
    ORDER BY points DESC, goal_difference DESC, goals_for DESC, team_id
  LOOP
    UPDATE standings
    SET position = v_position
    WHERE event_id = p_event_id AND team_id = v_team.team_id;
    
    v_position := v_position + 1;
  END LOOP;
END;
$$;
