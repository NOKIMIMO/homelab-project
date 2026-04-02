-- =============================================================
-- Migration: Initial schema for photo-module
-- Database:  photo-module
-- =============================================================

-- -------------------------------------------------------------
-- Asset
-- Represents a physical photo file stored on disk.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "asset" (
    "id"           INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name"         TEXT         NOT NULL UNIQUE,
    "metadata"     JSONB,
    "date_photo"   TIMESTAMPTZ,
    "date_upload"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "origin"       TEXT
);

-- -------------------------------------------------------------
-- Board
-- A named canvas on which assets can be arranged.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "board" (
    "id"           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"         TEXT         NOT NULL,
    "height"       INTEGER      NOT NULL DEFAULT 0,
    "width"        INTEGER      NOT NULL DEFAULT 0,
    "last_update"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- Board_Asset
-- Join table that places an asset onto a board with transform data.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "board_asset" (
    "board_id"     UUID         NOT NULL REFERENCES "board"("id") ON DELETE CASCADE,
    "asset_name"   TEXT         NOT NULL,
    "scale"        REAL         NOT NULL DEFAULT 1.0,
    "rotation"     REAL         NOT NULL DEFAULT 0.0,
    "x_position"   REAL         NOT NULL DEFAULT 0.0,
    "y_position"   REAL         NOT NULL DEFAULT 0.0,
    "src"          TEXT         NOT NULL,
    "last_update"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY ("board_id", "asset_name")
);

-- -------------------------------------------------------------
-- Synchro
-- Tracks synchronisation checkpoints between mobile and server.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "synchro" (
    "id"    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "date"  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
