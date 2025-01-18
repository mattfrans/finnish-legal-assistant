-- Create database if it doesn't exist
CREATE DATABASE finnish_legal_ai;

-- Connect to the database
\c finnish_legal_ai

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS vector;
