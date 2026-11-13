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

-- LCDP - Sélection transactionnelle d'invités DUO/FAMILLE pour un accès.
-- Uniquement le Worker, via service_role, transmet l'identité issue du cookie signé.
-- Dépend de inviteabo, inviteacces, paiement_commandes, prixabo, fluxm, invitation.
CREATE OR REPLACE FUNCTION public.lcdp_enregistrer_invites_abonnement(
  p_idflux uuid, p_idmembre uuid, p_selection jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_source public.fluxm%ROWTYPE;
  v_abo public.abo%ROWTYPE;
  v_prix public.prixabo%ROWTYPE;
  v_abo_count integer;
  v_maxduo integer;
  v_duoplus integer;
  v_freqduoplus integer;
  v_famille integer;
  v_option record;
  v_facteur_attendu integer;
  v_cat text;
  v_liste jsonb;
  v_item jsonb;
  v_id uuid;
  v_email text;
  v_idmembreinvite uuid;
  v_idinvite bigint;
  v_idfluxinvite uuid;
  v_contact public.inviteabo%ROWTYPE;
  v_selection uuid[] := ARRAY[]::uuid[];
  v_categories text[] := ARRAY[]::text[];
  v_emails text[] := ARRAY[]::text[];
  v_selection_emails text[] := ARRAY[]::text[];
  v_new_categories text[] := ARRAY[]::text[];
  v_nbduo integer := 0;
  v_nbfamille integer := 0;
  v_duo_mois integer := 0;
  v_limite timestamptz;
  v_compteur integer;
  v_retour jsonb := '[]'::jsonb;
  v_annules integer := 0;
  v_annulation_emails text[] := ARRAY[]::text[];
  v_nouveaux integer := 0;
  v_ligne record;
BEGIN
  IF p_selection IS NULL OR jsonb_typeof(p_selection) <> 'object'
    OR NOT (p_selection ? 'duo') OR NOT (p_selection ? 'famille') THEN
    RAISE EXCEPTION 'Sélection DUO/FAMILLE invalide.' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.membres WHERE idmembre = p_idmembre AND emailvalid = true AND emailvalidmode = 'inscription') THEN
    RAISE EXCEPTION 'Membre invitant non valide.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO STRICT v_source FROM public.fluxm WHERE idflux = p_idflux AND idmembre = p_idmembre FOR UPDATE;
  IF v_source.invitation OR v_source.statut NOT IN ('bookd','chekd','full') THEN
    RAISE EXCEPTION 'Accès personnel non disponible.' USING ERRCODE = '22023';
  END IF;
  IF v_source.datebookf IS NULL OR v_source.datebookf<=v_source.datebookd THEN
    RAISE EXCEPTION 'Les horaires de cet accès doivent être actualisés.' USING ERRCODE='22023';
  END IF;
  IF v_source.datebookd <= now() THEN
    RAISE EXCEPTION 'Cet accès a déjà commencé.' USING ERRCODE = '22023';
  END IF;
  SELECT count(*) INTO v_abo_count FROM public.abo a
    WHERE a.idmembre=p_idmembre AND a.statutabo='paye'
      AND (a.debut AT TIME ZONE 'Europe/Paris')::date <= (v_source.datebookd AT TIME ZONE 'Europe/Paris')::date
      AND (a.fin AT TIME ZONE 'Europe/Paris')::date >= (v_source.datebookd AT TIME ZONE 'Europe/Paris')::date;
  IF v_abo_count <> 1 THEN RAISE EXCEPTION 'Abonnement payé couvrant cet accès absent ou ambigu.' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_abo FROM public.abo a
    WHERE a.idmembre=p_idmembre AND a.statutabo='paye'
      AND (a.debut AT TIME ZONE 'Europe/Paris')::date <= (v_source.datebookd AT TIME ZONE 'Europe/Paris')::date
      AND (a.fin AT TIME ZONE 'Europe/Paris')::date >= (v_source.datebookd AT TIME ZONE 'Europe/Paris')::date
    FOR UPDATE;
  -- Les privilèges de prixabo ne bloquent pas l'enregistrement pendant
  -- cette première étape. La réservation et l'abonnement payé restent vérifiés.
  -- Construire les cibles, sans écrire avant validation de la sélection.
  FOREACH v_cat IN ARRAY ARRAY['duo','famille'] LOOP
    v_liste := p_selection->v_cat;
    IF jsonb_typeof(v_liste) <> 'object' OR jsonb_typeof(v_liste->'existants') <> 'array'
      OR jsonb_typeof(v_liste->'nouveaux') <> 'array' THEN
      RAISE EXCEPTION 'Sélection % invalide.',v_cat USING ERRCODE='22023';
    END IF;
    IF jsonb_array_length(v_liste->'existants')>100 OR jsonb_array_length(v_liste->'nouveaux')>100 THEN
      RAISE EXCEPTION 'Trop d’invités demandés.' USING ERRCODE='22023';
    END IF;
    FOR v_item IN SELECT value FROM jsonb_array_elements(v_liste->'existants') LOOP
      IF jsonb_typeof(v_item)<>'string' THEN RAISE EXCEPTION 'Identifiant invité invalide.' USING ERRCODE='22023'; END IF;
      v_id := trim(both '"' from v_item::text)::uuid;
      SELECT * INTO v_contact FROM public.inviteabo WHERE idinviteabo=v_id AND idabo=v_abo.idabo AND categorie=v_cat;
      IF NOT FOUND THEN RAISE EXCEPTION 'Invité étranger au carnet %.',v_cat USING ERRCODE='22023'; END IF;
      IF EXISTS (SELECT 1 FROM public.membres m WHERE m.idmembre=p_idmembre AND lower(m.emailmembre)=v_contact.email) THEN
        RAISE EXCEPTION 'Impossible de vous inviter vous-même.' USING ERRCODE='22023';
      END IF;
      IF v_id=ANY(v_selection) THEN RAISE EXCEPTION 'Invité sélectionné plusieurs fois.' USING ERRCODE='22023'; END IF;
      IF v_contact.email=ANY(v_selection_emails) THEN RAISE EXCEPTION 'Adresse sélectionnée plusieurs fois.' USING ERRCODE='22023'; END IF;
      v_selection_emails:=array_append(v_selection_emails,v_contact.email);
      v_selection := array_append(v_selection,v_id);
      v_categories := array_append(v_categories,v_cat);
      IF v_cat='duo' THEN v_nbduo:=v_nbduo+1; ELSE v_nbfamille:=v_nbfamille+1; END IF;
    END LOOP;
    FOR v_item IN SELECT value FROM jsonb_array_elements(v_liste->'nouveaux') LOOP
      IF jsonb_typeof(v_item)<>'string' THEN RAISE EXCEPTION 'Adresse e-mail invalide.' USING ERRCODE='22023'; END IF;
      v_email := lower(btrim(v_item #>> '{}'));
      IF length(v_email)<3 OR length(v_email)>320 OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
        RAISE EXCEPTION 'Adresse e-mail invalide.' USING ERRCODE='22023';
      END IF;
      IF v_email=ANY(v_emails) OR v_email=ANY(v_selection_emails) OR EXISTS (
         SELECT 1 FROM public.inviteabo i WHERE i.idabo=v_abo.idabo AND i.email=v_email
      ) THEN
         RAISE EXCEPTION 'Adresse déjà présente dans le carnet.' USING ERRCODE='22023';
      END IF;
      IF EXISTS (SELECT 1 FROM public.membres WHERE idmembre=p_idmembre AND lower(emailmembre)=v_email) THEN
        RAISE EXCEPTION 'Impossible de vous inviter vous-même.' USING ERRCODE='22023';
      END IF;
      v_emails := array_append(v_emails,v_email);
      v_new_categories := array_append(v_new_categories,v_cat);
      IF v_cat='duo' THEN v_nbduo:=v_nbduo+1; ELSE v_nbfamille:=v_nbfamille+1; END IF;
    END LOOP;
  END LOOP;
  -- Première activation : conserver la validation des e-mails et des
  -- appartenances, sans appliquer encore les quotas DUO/FAMILLE ni DUO+.
  v_limite := (((v_source.datebookd AT TIME ZONE 'Europe/Paris')::date - 1) + time '14:00') AT TIME ZONE 'Europe/Paris';
  IF now() >= v_limite AND EXISTS (
    SELECT 1 FROM public.inviteacces ia
    JOIN public.inviteabo ib ON ib.idinviteabo=ia.idinviteabo
    WHERE ia.idflux=p_idflux AND ib.idabo=v_abo.idabo
      AND ia.statut<>'cancd' AND NOT (ia.idinviteabo=ANY(v_selection))
  ) THEN RAISE EXCEPTION 'Annulation impossible après 14h.' USING ERRCODE='22023'; END IF;
  -- Les invitations historiques sans catégorie ne sont pas requalifiées silencieusement.
  IF EXISTS (
    SELECT 1 FROM public.invitation it
    WHERE it.idflux=p_idflux AND it.invit='true'
      AND NOT EXISTS (
        SELECT 1 FROM public.inviteacces ia
        JOIN public.inviteabo ib ON ib.idinviteabo=ia.idinviteabo
        WHERE ia.idflux=p_idflux AND ia.idinvite=it.idinvite AND ib.idabo=v_abo.idabo
      )
  ) THEN RAISE EXCEPTION 'Invitations antérieures à qualifier DUO/FAMILLE.' USING ERRCODE='22023'; END IF;

  -- Annulations en une transaction : également sur les tables historiques.
  FOR v_ligne IN
    SELECT ia.idinviteacces,ia.idinvite,ib.idmembreinvite,ib.email
    FROM public.inviteacces ia JOIN public.inviteabo ib ON ib.idinviteabo=ia.idinviteabo
    WHERE ia.idflux=p_idflux AND ib.idabo=v_abo.idabo AND ia.statut<>'cancd'
      AND NOT (ia.idinviteabo=ANY(v_selection)) FOR UPDATE OF ia
  LOOP
    UPDATE public.inviteacces SET statut='cancd',dateannulation=now() WHERE idinviteacces=v_ligne.idinviteacces;
    IF v_ligne.idinvite IS NOT NULL THEN
      UPDATE public.invitation SET invit='cancd',datecancd=now(),source='parrain' WHERE idinvite=v_ligne.idinvite;
    END IF;
    UPDATE public.fluxm SET statut='cancd',datecancd=now()
      WHERE idfluxparrain=p_idflux AND idmembre=v_ligne.idmembreinvite AND invitation=true AND statut<>'cancd';
    v_annules:=v_annules+1;
    v_annulation_emails:=array_append(v_annulation_emails,v_ligne.email);
  END LOOP;

  -- Les nouveaux contacts du carnet restent cumulatifs sur l'abonnement.
  FOR v_compteur IN 1..COALESCE(array_length(v_emails,1),0) LOOP
    v_email:=v_emails[v_compteur];
    v_cat:=v_new_categories[v_compteur];
    PERFORM pg_advisory_xact_lock(hashtextextended(v_email,20261113));
    SELECT idmembre INTO v_idmembreinvite FROM public.membres
      WHERE lower(btrim(emailmembre))=v_email ORDER BY emailvalid DESC,datecreation ASC LIMIT 1;
    IF v_idmembreinvite IS NULL THEN
      INSERT INTO public.membres(emailmembre,emailvalid,emailvalidmode)
        VALUES(v_email,false,'invitation') RETURNING idmembre INTO v_idmembreinvite;
    END IF;
    INSERT INTO public.inviteabo(idabo,categorie,email,idmembreinvite,dateliaison)
      VALUES(v_abo.idabo,v_cat,v_email,v_idmembreinvite,now())
      RETURNING idinviteabo INTO v_id;
    v_selection:=array_append(v_selection,v_id);
    v_nouveaux:=v_nouveaux+1;
  END LOOP;

  -- Liaison du membre invité, réservation et invitation historique, une seule transaction.
  FOREACH v_id IN ARRAY v_selection LOOP
    SELECT * INTO STRICT v_contact FROM public.inviteabo WHERE idinviteabo=v_id AND idabo=v_abo.idabo;
    v_idmembreinvite:=v_contact.idmembreinvite;
    IF v_idmembreinvite IS NULL THEN
      SELECT idmembre INTO v_idmembreinvite FROM public.membres
        WHERE lower(btrim(emailmembre))=v_contact.email ORDER BY emailvalid DESC,datecreation ASC LIMIT 1;
      IF v_idmembreinvite IS NULL THEN
        INSERT INTO public.membres(emailmembre,emailvalid,emailvalidmode)
          VALUES(v_contact.email,false,'invitation') RETURNING idmembre INTO v_idmembreinvite;
      END IF;
      UPDATE public.inviteabo SET idmembreinvite=v_idmembreinvite,dateliaison=now() WHERE idinviteabo=v_id;
    END IF;
    -- Un invité ne peut pas consommer deux accès à la même plage.
    IF EXISTS (
      SELECT 1 FROM public.fluxm f WHERE f.idmembre=v_idmembreinvite
        AND f.datebookd=v_source.datebookd AND f.plagebookd=v_source.plagebookd
        AND f.statut IN ('bookd','chekd','full')
        AND NOT (f.invitation=true AND f.idfluxparrain=p_idflux)
    ) THEN RAISE EXCEPTION 'Un invité dispose déjà d’un accès sur cette plage.' USING ERRCODE='22023'; END IF;
    SELECT idflux INTO v_idfluxinvite FROM public.fluxm
      WHERE idmembre=v_idmembreinvite AND invitation=true AND idfluxparrain=p_idflux
      ORDER BY dateflux DESC LIMIT 1 FOR UPDATE;
    IF v_idfluxinvite IS NULL THEN
      INSERT INTO public.fluxm(idmembre,invitation,idparrain,idfluxparrain,idparc,datebookd,plagebookd,statut)
        VALUES(v_idmembreinvite,true,p_idmembre,p_idflux,v_source.idparc,v_source.datebookd,v_source.plagebookd,'bookd')
        RETURNING idflux INTO v_idfluxinvite;
    ELSE
      UPDATE public.fluxm SET statut='bookd',datecancd=NULL WHERE idflux=v_idfluxinvite AND statut='cancd';
    END IF;
    INSERT INTO public.invitation(idflux,idmembre,invit,dateinvit,datecancd,source)
      VALUES(p_idflux,v_idmembreinvite,'true',now(),NULL,NULL)
      ON CONFLICT(idflux,idmembre) DO UPDATE SET invit='true',datecancd=NULL,source=NULL
      RETURNING idinvite INTO v_idinvite;
    SELECT statut INTO v_cat FROM public.inviteacces WHERE idflux=p_idflux AND idinviteabo=v_id FOR UPDATE;
    IF NOT FOUND THEN
      INSERT INTO public.inviteacces(idflux,idinviteabo,idinvite,statut)
        VALUES(p_idflux,v_id,v_idinvite,'en_attente');
    ELSIF v_cat='cancd' THEN
      UPDATE public.inviteacces SET statut='en_attente',dateannulation=NULL,dateenvoi=NULL,idinvite=v_idinvite
        WHERE idflux=p_idflux AND idinviteabo=v_id;
    ELSIF v_cat='erreur' THEN
      UPDATE public.inviteacces SET statut='en_attente',dateenvoi=NULL,idinvite=v_idinvite
        WHERE idflux=p_idflux AND idinviteabo=v_id;
    END IF;
  END LOOP;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'idinviteacces',ia.idinviteacces,'email',ib.email,
      'idfluxInvite',fi.idflux,'idmembre',ib.idmembreinvite
    )),'[]'::jsonb) INTO v_retour
    FROM public.inviteacces ia JOIN public.inviteabo ib ON ib.idinviteabo=ia.idinviteabo
    JOIN public.fluxm fi ON fi.idmembre=ib.idmembreinvite AND fi.idfluxparrain=p_idflux AND fi.invitation=true AND fi.statut<>'cancd'
    WHERE ia.idflux=p_idflux AND ia.statut='en_attente'
      AND (ia.dateenvoi IS NULL OR ia.dateenvoi < now()-interval '15 minutes');
  RETURN jsonb_build_object('ok',true,'confirme',true,'idflux',p_idflux,
    'envois',v_retour,'contactsAjoutes',v_nouveaux,'annulations',v_annules,
    'annulationsEmails',to_jsonb(v_annulation_emails),
    'nbDuo',v_nbduo,'nbFamille',v_nbfamille);
END;
$function$;
REVOKE ALL ON FUNCTION public.lcdp_enregistrer_invites_abonnement(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lcdp_enregistrer_invites_abonnement(uuid,uuid,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.lcdp_marquer_envoi_invite(
 p_idinviteacces uuid, p_idmembre uuid, p_reussi boolean
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp
AS $function$
DECLARE v_ligne public.inviteacces%ROWTYPE;
BEGIN
 SELECT ia.* INTO v_ligne FROM public.inviteacces ia
 JOIN public.fluxm f ON f.idflux=ia.idflux
 WHERE ia.idinviteacces=p_idinviteacces AND f.idmembre=p_idmembre AND f.invitation=false FOR UPDATE OF ia;
 IF NOT FOUND OR v_ligne.statut<>'en_attente' THEN RETURN false; END IF;
 UPDATE public.inviteacces SET statut=CASE WHEN p_reussi THEN 'envoye' ELSE 'erreur' END,
   dateenvoi=CASE WHEN p_reussi THEN now() ELSE NULL END
 WHERE idinviteacces=p_idinviteacces;
 RETURN true;
END;
$function$;
REVOKE ALL ON FUNCTION public.lcdp_marquer_envoi_invite(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lcdp_marquer_envoi_invite(uuid,uuid,boolean) TO service_role;

-- Réclamation atomique de l'envoi : évite les e-mails dupliqués à deux clics.
CREATE OR REPLACE FUNCTION public.lcdp_reclamer_envoi_invite(
  p_idinviteacces uuid, p_idmembre uuid
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp
AS $function$
DECLARE v_ligne public.inviteacces%ROWTYPE;
BEGIN
 SELECT ia.* INTO v_ligne FROM public.inviteacces ia
 JOIN public.fluxm f ON f.idflux=ia.idflux
 WHERE ia.idinviteacces=p_idinviteacces AND f.idmembre=p_idmembre AND f.invitation=false
 FOR UPDATE OF ia;
 IF NOT FOUND OR v_ligne.statut<>'en_attente' OR
   (v_ligne.dateenvoi IS NOT NULL AND v_ligne.dateenvoi >= now()-interval '15 minutes') THEN RETURN false; END IF;
 UPDATE public.inviteacces SET dateenvoi=now() WHERE idinviteacces=p_idinviteacces;
 RETURN true;
END;
$function$;
REVOKE ALL ON FUNCTION public.lcdp_reclamer_envoi_invite(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lcdp_reclamer_envoi_invite(uuid,uuid) TO service_role;

-- Annulation depuis un lien signé : synchroniser les trois tables dans la même transaction.
CREATE OR REPLACE FUNCTION public.lcdp_annuler_invitation_par_jeton(
  p_idflux_source uuid,
  p_idflux_invite uuid,
  p_idmembre_invite uuid
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_source public.fluxm%ROWTYPE;
  v_invite public.fluxm%ROWTYPE;
  v_limite timestamptz;
BEGIN
  SELECT * INTO v_source FROM public.fluxm
  WHERE idflux=p_idflux_source AND invitation=false FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Réservation de l’invitant introuvable.' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_invite FROM public.fluxm
  WHERE idflux=p_idflux_invite AND idmembre=p_idmembre_invite
    AND idfluxparrain=p_idflux_source AND invitation=true FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation introuvable.' USING ERRCODE='22023'; END IF;
  IF v_invite.statut='cancd' THEN RETURN false; END IF;
  v_limite := (((v_source.datebookd AT TIME ZONE 'Europe/Paris')::date - 1) + time '14:00') AT TIME ZONE 'Europe/Paris';
  IF now()>=v_limite THEN
    RAISE EXCEPTION 'Annulation impossible après 14h.' USING ERRCODE='22023';
  END IF;
  UPDATE public.invitation
    SET invit='cancd',datecancd=now(),source=NULL
    WHERE idflux=p_idflux_source AND idmembre=p_idmembre_invite AND invit='true';
  UPDATE public.fluxm SET statut='cancd',datecancd=now()
    WHERE idflux=p_idflux_invite AND statut<>'cancd';
  UPDATE public.inviteacces ia SET statut='cancd',dateannulation=now()
    WHERE ia.idflux=p_idflux_source AND ia.statut<>'cancd'
      AND ia.idinvite IN (
        SELECT i.idinvite FROM public.invitation i
        WHERE i.idflux=p_idflux_source AND i.idmembre=p_idmembre_invite
      );
  RETURN true;
END;
$function$;
REVOKE ALL ON FUNCTION public.lcdp_annuler_invitation_par_jeton(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lcdp_annuler_invitation_par_jeton(uuid,uuid,uuid) TO service_role;
