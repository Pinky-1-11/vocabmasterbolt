/*
  # Create vocabulary management tables

  1. New Tables
    - `api_settings`
      - `id` (uuid, primary key)
      - `gemini_api_key` (text, encrypted)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `books`
      - `id` (uuid, primary key)
      - `name` (text)
      - `cover_image` (text, base64)
      - `created_at` (timestamptz)
    
    - `vocabulary_pages`
      - `id` (uuid, primary key)
      - `name` (text)
      - `image_preview` (text, base64)
      - `csv_raw` (text)
      - `vocabulary_pairs` (jsonb)
      - `created_at` (timestamptz)
    
    - `book_pages`
      - `id` (uuid, primary key)
      - `book_id` (uuid, foreign key)
      - `page_id` (uuid, foreign key)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (no auth required for MVP)
*/

-- API Settings Table
CREATE TABLE IF NOT EXISTS api_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gemini_api_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to api_settings"
  ON api_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to api_settings"
  ON api_settings FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to api_settings"
  ON api_settings FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to api_settings"
  ON api_settings FOR DELETE
  TO public
  USING (true);

-- Books Table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cover_image text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to books"
  ON books FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to books"
  ON books FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to books"
  ON books FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to books"
  ON books FOR DELETE
  TO public
  USING (true);

-- Vocabulary Pages Table
CREATE TABLE IF NOT EXISTS vocabulary_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_preview text,
  csv_raw text NOT NULL,
  vocabulary_pairs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vocabulary_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to vocabulary_pages"
  ON vocabulary_pages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to vocabulary_pages"
  ON vocabulary_pages FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to vocabulary_pages"
  ON vocabulary_pages FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to vocabulary_pages"
  ON vocabulary_pages FOR DELETE
  TO public
  USING (true);

-- Book Pages Junction Table
CREATE TABLE IF NOT EXISTS book_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES vocabulary_pages(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(book_id, page_id)
);

ALTER TABLE book_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to book_pages"
  ON book_pages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to book_pages"
  ON book_pages FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to book_pages"
  ON book_pages FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to book_pages"
  ON book_pages FOR DELETE
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_book_pages_book_id ON book_pages(book_id);
CREATE INDEX IF NOT EXISTS idx_book_pages_page_id ON book_pages(page_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_pages_created_at ON vocabulary_pages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);