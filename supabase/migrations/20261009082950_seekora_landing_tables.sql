/*
# Seekora AI — Landing Page Tables

1. Overview
   Adds newsletter_subscribers, contact_messages, and subscriptions tables
   to support the landing page features (newsletter signup, contact form,
   and demo plan selection).

2. New Tables
   - newsletter_subscribers
     - id (serial PK)
     - email (text, unique)
     - created_at (timestamptz)
   - contact_messages
     - id (serial PK)
     - name (text)
     - email (text)
     - subject (text)
     - message (text)
     - created_at (timestamptz)
   - subscriptions
     - id (serial PK)
     - user_id (uuid FK -> auth.users, defaults to auth.uid())
     - plan_code (text: 'FREE' | 'PREMIUM')
     - billing_cycle (text: 'MONTHLY' | 'YEARLY')
     - created_at (timestamptz)

3. Security
   - newsletter_subscribers: public insert (anyone can subscribe), no read
     (admin-only via service role). RLS enabled, anon+authenticated INSERT only.
   - contact_messages: public insert (anyone can contact), no read via anon.
     RLS enabled, anon+authenticated INSERT only.
   - subscriptions: owner-scoped. Authenticated users can view/insert their
     own subscriptions. RLS enabled with auth.uid() ownership checks.
*/

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id serial PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_newsletter" ON newsletter_subscribers;
CREATE POLICY "anon_insert_newsletter" ON newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS contact_messages (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contact" ON contact_messages;
CREATE POLICY "anon_insert_contact" ON contact_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS subscriptions (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code text NOT NULL CHECK (plan_code IN ('FREE', 'PREMIUM')),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('MONTHLY', 'YEARLY')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscriptions" ON subscriptions;
CREATE POLICY "select_own_subscriptions" ON subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_subscriptions" ON subscriptions;
CREATE POLICY "insert_own_subscriptions" ON subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);