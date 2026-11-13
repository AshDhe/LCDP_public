-- La Clé du Parc — INVITÉ DUO / INVITÉS FAMILLE
-- Appliqué dans Supabase : inviteabo_inviteacces_duo_famille
-- Compte abonné (inviteabo) distinct des invitations sur un accès (inviteacces).
CREATE TABLE IF NOT EXISTS public.inviteabo (
  idinviteabo uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idabo uuid NOT NULL REFERENCES public.abo(idabo) ON DELETE RESTRICT,
  categorie text NOT NULL CHECK (categorie IN ('duo', 'famille')),
  email text NOT NULL CHECK (
    length(email) BETWEEN 3 AND 320
    AND email = lower(btrim(email))
    AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  idmembreinvite uuid NULL REFERENCES public.membres(idmembre) ON DELETE SET NULL,
  datecreation timestamptz NOT NULL DEFAULT now(),
  dateliaison timestamptz NULL,
  CONSTRAINT inviteabo_unique_categorie_email UNIQUE (idabo, categorie, email)
);
CREATE INDEX IF NOT EXISTS inviteabo_idabo_categorie_idx ON public.inviteabo (idabo,categorie);

CREATE TABLE IF NOT EXISTS public.inviteacces (
  idinviteacces uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idflux uuid NOT NULL REFERENCES public.fluxm(idflux) ON DELETE RESTRICT,
  idinviteabo uuid NOT NULL REFERENCES public.inviteabo(idinviteabo) ON DELETE RESTRICT,
  statut text NOT NULL DEFAULT 'selectionne'
    CHECK (statut IN ('selectionne','en_attente','envoye','erreur','cancd')),
  idinvite bigint NULL REFERENCES public.invitation(idinvite) ON DELETE SET NULL,
  datecreation timestamptz NOT NULL DEFAULT now(),
  dateenvoi timestamptz NULL,
  dateannulation timestamptz NULL,
  CONSTRAINT inviteacces_unique_flux_contact UNIQUE (idflux,idinviteabo)
);
CREATE INDEX IF NOT EXISTS inviteacces_idinviteabo_idx ON public.inviteacces(idinviteabo);
CREATE INDEX IF NOT EXISTS inviteacces_idflux_statut_idx ON public.inviteacces(idflux,statut);

ALTER TABLE public.inviteabo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inviteacces ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.inviteabo, public.inviteacces FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inviteabo, public.inviteacces TO service_role;
