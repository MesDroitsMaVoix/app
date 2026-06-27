-- =============================================================================
-- Mes Droits, Ma Voix — schéma Supabase
-- =============================================================================
-- À exécuter UNE FOIS dans Supabase → SQL Editor (bouton "Run").
--
-- Modèle "document" : chaque collection de l'app est une table (id, data jsonb).
-- L'application filtre les données côté client, donc ce format simple suffit et
-- garde le code TypeScript et la base parfaitement alignés.
--
-- Les données de démarrage NE sont PAS insérées ici : l'application les recopie
-- automatiquement au premier lancement (auto-seed). Ce fichier ne crée que la
-- structure.
-- =============================================================================

create table if not exists accounts      (id text primary key, data jsonb not null);
create table if not exists people        (id text primary key, data jsonb not null);
create table if not exists ateliers      (id text primary key, data jsonb not null);
create table if not exists groups        (id text primary key, data jsonb not null);
create table if not exists events        (id text primary key, data jsonb not null);
create table if not exists reports       (id text primary key, data jsonb not null);
create table if not exists conversations (id text primary key, data jsonb not null);
create table if not exists notifications  (id text primary key, data jsonb not null);

-- Sécurité : on active RLS sans politique publique. Seul le rôle "service_role"
-- (utilisé uniquement côté serveur, jamais exposé au navigateur) peut lire/écrire ;
-- il contourne RLS. La clé "anon" publique, elle, ne peut rien voir.
alter table accounts      enable row level security;
alter table people        enable row level security;
alter table ateliers      enable row level security;
alter table groups        enable row level security;
alter table events        enable row level security;
alter table reports       enable row level security;
alter table conversations enable row level security;
alter table notifications enable row level security;

-- =============================================================================
-- Stockage des pièces jointes (PDF / images / Word)
-- =============================================================================
-- Bucket public en lecture (pour afficher/télécharger), écriture via service_role.
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;
