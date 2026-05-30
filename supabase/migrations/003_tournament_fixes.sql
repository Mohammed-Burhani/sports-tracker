-- Migration 003: Tournament Fixes
-- Add court_names column

-- Add court_names column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS court_names text[];
