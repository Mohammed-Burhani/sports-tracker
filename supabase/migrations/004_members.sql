-- Create members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age > 0 AND age <= 120),
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on event_id for faster lookups
CREATE INDEX idx_members_event_id ON members(event_id);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- RLS policies scoped to organization_id
CREATE POLICY "Users can view members in their organization"
  ON members FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert members in their organization"
  ON members FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update members in their organization"
  ON members FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete members in their organization"
  ON members FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

-- Create RPC function to randomly assign members to teams
CREATE OR REPLACE FUNCTION assign_members_to_teams(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_teams UUID[];
  v_team_index INTEGER := 0;
  v_team_count INTEGER;
  v_assigned_count INTEGER := 0;
  v_team_member_counts JSONB := '{}';
BEGIN
  -- Fetch all teams for the event
  SELECT ARRAY_AGG(id ORDER BY created_at)
  INTO v_teams
  FROM teams
  WHERE event_id = p_event_id;

  -- Check if there are teams
  IF v_teams IS NULL OR array_length(v_teams, 1) = 0 THEN
    RAISE EXCEPTION 'No teams found for this event';
  END IF;

  v_team_count := array_length(v_teams, 1);

  -- Initialize team member counts
  FOR i IN 1..v_team_count LOOP
    v_team_member_counts := jsonb_set(
      v_team_member_counts,
      ARRAY[v_teams[i]::TEXT],
      '0'
    );
  END LOOP;

  -- Fetch unassigned members randomly and assign them
  FOR v_member IN
    SELECT id
    FROM members
    WHERE event_id = p_event_id
      AND team_id IS NULL
    ORDER BY random()
  LOOP
    -- Round-robin assignment
    v_team_index := (v_assigned_count % v_team_count) + 1;
    
    -- Update member's team_id
    UPDATE members
    SET team_id = v_teams[v_team_index]
    WHERE id = v_member.id;
    
    -- Increment count for this team
    v_team_member_counts := jsonb_set(
      v_team_member_counts,
      ARRAY[v_teams[v_team_index]::TEXT],
      to_jsonb((v_team_member_counts->>v_teams[v_team_index]::TEXT)::INTEGER + 1)
    );
    
    v_assigned_count := v_assigned_count + 1;
  END LOOP;

  -- Update player_count for each team based on actual assigned members
  FOR i IN 1..v_team_count LOOP
    UPDATE teams
    SET player_count = (
      SELECT COUNT(*)
      FROM members
      WHERE team_id = v_teams[i]
    )
    WHERE id = v_teams[i];
  END LOOP;

  RETURN v_assigned_count;
END;
$$;
