-- =============================================================================
-- Mes Droits, Ma Voix — jeu de données de DÉMONSTRATION
-- =============================================================================
-- À exécuter dans Supabase → SQL Editor (bouton "Run"), APRÈS schema.sql.
--
-- Ce script remplit l'application avec un ESAT fictif mais réaliste :
--   • 4 comptes de connexion (voir les codes plus bas)
--   • 13 personnes réparties dans 4 ateliers
--   • un Conseil de la Vie Sociale (CVS) avec délégués et suppléants
--   • un agenda (réunions passées et à venir)
--   • des comptes rendus (validés + un EN ATTENTE pour démontrer la validation)
--   • des conversations de messagerie avec messages
--   • des notifications non lues
--
-- Il est ré-exécutable : chaque ligne est un "upsert" (on conflict do update).
-- Pour repartir de zéro avant : voir le bloc "RESET" tout en bas (commenté).
--
-- ---------------------------------------------------------------------------
-- CODES DE CONNEXION POUR LA DÉMO (chaque personne a son compte) :
--   Sophie Lefèvre   (Direction / admin) ............ 2580
--   Julien Mercier   (travailleur, Cuisine, CVS) .... 1234
--   Amélie Bonnet    (cheffe d'atelier Cuisine) ..... 1111
--   Karim Haddad     (délégué CVS, Espaces Verts) ... 2222
--   Nadia Fournier   (Espaces Verts) ................ 3333
--   Thomas Petit     (chef Blanchisserie) ........... 4444
--   Léa Rousseau     (Blanchisserie, suppléante CVS)  5555
--   Marc Dubois      (chef Conditionnement) ......... 6666
--   Inès Moreau      (Conditionnement) .............. 7777
--   Hugo Girard      (Cuisine) ...................... 8888
--   Sarah Benali     (Espaces Verts) ................ 9999
--   Lucas Meyer      (Blanchisserie) ............... 1212
--   Chloé Faure      (Conditionnement) ............. 1313
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- Comptes de connexion (accounts) — un par personne
-- ===========================================================================
insert into accounts (id, data) values
  ('acc-admin',       $j${"id":"acc-admin","name":"Sophie Lefèvre","initials":"SL","role":"admin","code":"2580","personId":"p7"}$j$::jsonb),
  ('acc-travailleur', $j${"id":"acc-travailleur","name":"Julien Mercier","initials":"JM","role":"travailleur","code":"1234","personId":"p1"}$j$::jsonb),
  ('acc-p2',          $j${"id":"acc-p2","name":"Amélie Bonnet","initials":"AB","role":"travailleur","code":"1111","personId":"p2"}$j$::jsonb),
  ('acc-p3',          $j${"id":"acc-p3","name":"Karim Haddad","initials":"KH","role":"travailleur","code":"2222","personId":"p3"}$j$::jsonb),
  ('acc-p4',          $j${"id":"acc-p4","name":"Nadia Fournier","initials":"NF","role":"travailleur","code":"3333","personId":"p4"}$j$::jsonb),
  ('acc-p5',          $j${"id":"acc-p5","name":"Thomas Petit","initials":"TP","role":"travailleur","code":"4444","personId":"p5"}$j$::jsonb),
  ('acc-p6',          $j${"id":"acc-p6","name":"Léa Rousseau","initials":"LR","role":"travailleur","code":"5555","personId":"p6"}$j$::jsonb),
  ('acc-p8',          $j${"id":"acc-p8","name":"Marc Dubois","initials":"MD","role":"travailleur","code":"6666","personId":"p8"}$j$::jsonb),
  ('acc-p9',          $j${"id":"acc-p9","name":"Inès Moreau","initials":"IM","role":"travailleur","code":"7777","personId":"p9"}$j$::jsonb),
  ('acc-p10',         $j${"id":"acc-p10","name":"Hugo Girard","initials":"HG","role":"travailleur","code":"8888","personId":"p10"}$j$::jsonb),
  ('acc-p11',         $j${"id":"acc-p11","name":"Sarah Benali","initials":"SB","role":"travailleur","code":"9999","personId":"p11"}$j$::jsonb),
  ('acc-p12',         $j${"id":"acc-p12","name":"Lucas Meyer","initials":"LM","role":"travailleur","code":"1212","personId":"p12"}$j$::jsonb),
  ('acc-p13',         $j${"id":"acc-p13","name":"Chloé Faure","initials":"CF","role":"travailleur","code":"1313","personId":"p13"}$j$::jsonb)
on conflict (id) do update set data = excluded.data;

-- ===========================================================================
-- Personnel (people)
-- ===========================================================================
insert into people (id, data) values
  ('p7',  $j${"id":"p7","name":"Sophie Lefèvre","initials":"SL","atelier":"Direction","kind":"admin","fonction":"Directrice adjointe"}$j$::jsonb),
  ('p1',  $j${"id":"p1","name":"Julien Mercier","initials":"JM","atelier":"Cuisine","kind":"travailleur","fonction":"Commis de cuisine"}$j$::jsonb),
  ('p2',  $j${"id":"p2","name":"Amélie Bonnet","initials":"AB","atelier":"Cuisine","kind":"travailleur","fonction":"Cuisinière"}$j$::jsonb),
  ('p10', $j${"id":"p10","name":"Hugo Girard","initials":"HG","atelier":"Cuisine","kind":"travailleur","fonction":"Aide de cuisine"}$j$::jsonb),
  ('p3',  $j${"id":"p3","name":"Karim Haddad","initials":"KH","atelier":"Espaces Verts","kind":"travailleur","fonction":"Jardinier"}$j$::jsonb),
  ('p4',  $j${"id":"p4","name":"Nadia Fournier","initials":"NF","atelier":"Espaces Verts","kind":"travailleur","fonction":"Jardinière"}$j$::jsonb),
  ('p11', $j${"id":"p11","name":"Sarah Benali","initials":"SB","atelier":"Espaces Verts","kind":"travailleur","fonction":"Agente d'entretien"}$j$::jsonb),
  ('p5',  $j${"id":"p5","name":"Thomas Petit","initials":"TP","atelier":"Blanchisserie","kind":"travailleur","fonction":"Agent de blanchisserie"}$j$::jsonb),
  ('p6',  $j${"id":"p6","name":"Léa Rousseau","initials":"LR","atelier":"Blanchisserie","kind":"travailleur","fonction":"Agente de blanchisserie"}$j$::jsonb),
  ('p12', $j${"id":"p12","name":"Lucas Meyer","initials":"LM","atelier":"Blanchisserie","kind":"travailleur","fonction":"Agent de blanchisserie"}$j$::jsonb),
  ('p8',  $j${"id":"p8","name":"Marc Dubois","initials":"MD","atelier":"Conditionnement","kind":"travailleur","fonction":"Agent de conditionnement"}$j$::jsonb),
  ('p9',  $j${"id":"p9","name":"Inès Moreau","initials":"IM","atelier":"Conditionnement","kind":"travailleur","fonction":"Agente de conditionnement"}$j$::jsonb),
  ('p13', $j${"id":"p13","name":"Chloé Faure","initials":"CF","atelier":"Conditionnement","kind":"travailleur","fonction":"Agente de conditionnement"}$j$::jsonb)
on conflict (id) do update set data = excluded.data;

-- ===========================================================================
-- Ateliers
-- ===========================================================================
insert into ateliers (id, data) values
  ('a-cuisine', $j${"id":"a-cuisine","name":"Cuisine","chefId":"p2","suppleantIds":["p1"],"memberIds":["p2","p1","p10"]}$j$::jsonb),
  ('a-verts',   $j${"id":"a-verts","name":"Espaces Verts","chefId":"p3","suppleantIds":["p4"],"memberIds":["p3","p4","p11"]}$j$::jsonb),
  ('a-blanch',  $j${"id":"a-blanch","name":"Blanchisserie","chefId":"p5","suppleantIds":[],"memberIds":["p5","p6","p12"]}$j$::jsonb),
  ('a-condi',   $j${"id":"a-condi","name":"Conditionnement","chefId":"p8","suppleantIds":["p9"],"memberIds":["p8","p9","p13"]}$j$::jsonb)
on conflict (id) do update set data = excluded.data;

-- ===========================================================================
-- Groupes — dont le CVS (délégués + suppléants)
-- ===========================================================================
insert into groups (id, data) values
  ('g-cvs',  $j${"id":"g-cvs","name":"Conseil de la Vie Sociale (CVS)","memberIds":[],"atelierIds":[],"cvs":true,"delegateIds":["p3","p2"],"suppleantIds":["p1","p6"]}$j$::jsonb),
  ('g-secu', $j${"id":"g-secu","name":"Commission Sécurité & Cadre de vie","memberIds":["p7","p3","p5"],"atelierIds":[]}$j$::jsonb),
  ('g-fete', $j${"id":"g-fete","name":"Commission Fête de l'été","memberIds":["p7","p2","p11","p13"],"atelierIds":[]}$j$::jsonb)
on conflict (id) do update set data = excluded.data;

-- ===========================================================================
-- Agenda (events) — aujourd'hui = 2026-07-02
-- ===========================================================================
insert into events (id, data) values
  ('e1', $j${"id":"e1","date":"2026-07-08","time":"14:00","title":"Réunion plénière du CVS","place":"Salle polyvalente","type":"CVS","personIds":[],"groupIds":["g-cvs"],"authorId":"p7"}$j$::jsonb),
  ('e2', $j${"id":"e2","date":"2026-07-03","time":"10:30","title":"Réunion d'atelier Cuisine","place":"Cuisine centrale","type":"Atelier","personIds":["p2","p1","p10"],"groupIds":[],"authorId":"p2","atelierId":"a-cuisine"}$j$::jsonb),
  ('e3', $j${"id":"e3","date":"2026-07-10","time":"09:00","title":"Point sécurité Espaces Verts","place":"Local jardins","type":"Atelier","personIds":["p3","p4","p11"],"groupIds":[],"authorId":"p3","atelierId":"a-verts"}$j$::jsonb),
  ('e4', $j${"id":"e4","date":"2026-07-15","time":"11:00","title":"Assemblée générale des travailleurs","place":"Réfectoire","type":"Institution","personIds":[],"groupIds":["g-cvs","g-secu"],"authorId":"p7"}$j$::jsonb),
  ('e5', $j${"id":"e5","date":"2026-07-22","time":"15:00","title":"Préparation de la Fête de l'été","place":"Salle polyvalente","type":"Mixte","personIds":[],"groupIds":["g-fete"],"authorId":"p7"}$j$::jsonb),
  ('e6', $j${"id":"e6","date":"2026-06-24","time":"14:00","title":"Préréunion CVS (préparation)","place":"Bureau CVS","type":"CVS","personIds":["p3","p2","p1","p6"],"groupIds":[],"authorId":"p3"}$j$::jsonb)
on conflict (id) do update set data = excluded.data;

-- ===========================================================================
-- Comptes rendus (reports)
--   r3 est volontairement "pending" pour démontrer la validation par l'admin.
-- ===========================================================================
insert into reports (id, data) values
  ('r1', $j${"id":"r1","title":"Compte rendu du CVS — juin 2026","date":"2026-06-24","type":"CVS","summary":"Le Conseil de la Vie Sociale s'est réuni pour faire le point sur la vie de l'établissement : qualité des repas, projets d'activités de l'été et amélioration des espaces de repos.","decisions":["Installation d'un nouveau distributeur d'eau fraîche au réfectoire","Organisation d'une sortie collective au mois d'août","Mise en place d'une boîte à idées à l'accueil"],"actions":[{"text":"Demander plusieurs devis pour le distributeur d'eau","done":true},{"text":"Proposer 3 destinations pour la sortie d'août","done":false},{"text":"Fabriquer et installer la boîte à idées","done":false}],"personIds":[],"groupIds":[],"audienceAll":true,"attachments":[],"status":"validated","authorId":"p3","cvs":true,"contextLabel":"Conseil de la Vie Sociale (CVS)","createdAt":1782259200000}$j$::jsonb),
  ('r2', $j${"id":"r2","title":"Réunion Cuisine — menus de l'été","date":"2026-06-30","type":"Atelier","summary":"L'atelier Cuisine a préparé les menus de la période estivale en tenant compte des régimes particuliers et des produits de saison.","decisions":["Ajout d'une option de plat froid chaque midi","Achat de produits frais auprès du maraîcher local"],"actions":[{"text":"Établir le planning des menus de juillet","done":true},{"text":"Vérifier les régimes et allergies de chacun","done":false}],"personIds":["p2","p1","p10"],"groupIds":[],"attachments":[],"status":"validated","authorId":"p2","atelierId":"a-cuisine","createdAt":1782777600000}$j$::jsonb),
  ('r3', $j${"id":"r3","title":"Espaces Verts — sécurité des outils","date":"2026-07-01","type":"Atelier","summary":"Rappel des consignes de sécurité pour l'utilisation de la débroussailleuse et de la tondeuse. Point sur l'équipement de protection.","decisions":["Port obligatoire des gants et lunettes de protection","Rangement des outils tranchants sous clé"],"actions":[{"text":"Commander 4 paires de gants supplémentaires","done":false},{"text":"Afficher les consignes dans le local","done":false}],"personIds":["p3","p4","p11"],"groupIds":[],"attachments":[],"status":"pending","authorId":"p3","atelierId":"a-verts","createdAt":1782864000000}$j$::jsonb),
  ('r4', $j${"id":"r4","title":"Réunion d'information — nouveaux horaires","date":"2026-06-18","type":"Institution","summary":"Présentation à l'ensemble des travailleurs des nouveaux horaires d'été et du fonctionnement du transport adapté pendant les congés.","decisions":["Journée continue de 8h30 à 15h30 en juillet et août","Maintien du transport le matin et le soir"],"actions":[{"text":"Distribuer le planning d'été à chacun","done":true}],"personIds":[],"groupIds":[],"audienceAll":true,"attachments":[],"status":"validated","authorId":"p7","contextLabel":"Réunion institutionnelle","createdAt":1781740800000}$j$::jsonb)
on conflict (id) do update set data = excluded.data;

-- ===========================================================================
-- Messagerie (conversations)
--   • une conversation de groupe par atelier (créée avec l'atelier)
--   • deux conversations directes
-- ===========================================================================
insert into conversations (id, data) values
  ('1001', $j${"id":1001,"name":"Cuisine","role":"Atelier","initials":"CU","atelierId":"a-cuisine","memberIds":["p2","p1","p10"],"messages":[{"id":5001,"text":"Bonjour à tous, on se retrouve demain à 10h30 pour préparer les menus de l'été 🍅","time":"09:12","sentAt":1782806400000,"senderId":"p2"},{"id":5002,"text":"Parfait, je serai là !","time":"09:15","sentAt":1782806580000,"senderId":"p1"},{"id":5003,"text":"D'accord 👍","time":"09:20","sentAt":1782806880000,"senderId":"p10"}],"lastReadBy":{"p2":1782806880000,"p1":1782806580000}}$j$::jsonb),
  ('1002', $j${"id":1002,"name":"Espaces Verts","role":"Atelier","initials":"ES","atelierId":"a-verts","memberIds":["p3","p4","p11"],"messages":[{"id":5101,"text":"Pensez à prendre vos gants pour le point sécurité de vendredi.","time":"16:40","sentAt":1782758400000,"senderId":"p3"},{"id":5102,"text":"Merci Karim, c'est noté.","time":"16:45","sentAt":1782758700000,"senderId":"p4"}],"lastReadBy":{"p3":1782758700000}}$j$::jsonb),
  ('1003', $j${"id":1003,"name":"Blanchisserie","role":"Atelier","initials":"BL","atelierId":"a-blanch","memberIds":["p5","p6","p12"],"messages":[]}$j$::jsonb),
  ('1004', $j${"id":1004,"name":"Conditionnement","role":"Atelier","initials":"CO","atelierId":"a-condi","memberIds":["p8","p9","p13"],"messages":[]}$j$::jsonb),
  ('2001', $j${"id":2001,"name":"Amélie Bonnet","role":"travailleur","initials":"AB","participantIds":["p1","p2"],"messages":[{"id":6001,"text":"Salut Julien, tu peux venir 10 minutes plus tôt demain ?","time":"18:02","sentAt":1782849720000,"senderId":"p2"},{"id":6002,"text":"Oui pas de souci 🙂","time":"18:10","sentAt":1782850200000,"senderId":"p1"}],"lastReadBy":{"p2":1782850200000}}$j$::jsonb),
  ('2002', $j${"id":2002,"name":"Sophie Lefèvre","role":"admin","initials":"SL","participantIds":["p1","p7"],"messages":[{"id":6101,"text":"Bonjour Julien, n'oubliez pas la réunion du CVS le 8 juillet.","time":"11:30","sentAt":1782903000000,"senderId":"p7"}]}$j$::jsonb)
on conflict (id) do update set data = excluded.data;

-- ===========================================================================
-- Notifications (non lues pour Julien = p1)
-- ===========================================================================
insert into notifications (id, data) values
  ('n1', $j${"id":"n1","text":"Nouveau compte rendu : Compte rendu du CVS — juin 2026","createdAt":1782903600000,"recipientIds":["p1","p2","p3","p4","p5","p6","p8","p9","p10","p11","p12","p13"],"readBy":[],"page":"comptes"}$j$::jsonb),
  ('n2', $j${"id":"n2","text":"Nouvelle réunion : Réunion plénière du CVS","createdAt":1782904200000,"recipientIds":["p3","p2","p1","p6"],"readBy":[],"page":"agenda"}$j$::jsonb),
  ('n3', $j${"id":"n3","text":"Nouveau message de Sophie Lefèvre","createdAt":1782903000000,"recipientIds":["p1"],"readBy":[],"page":"messagerie","convId":2002}$j$::jsonb)
on conflict (id) do update set data = excluded.data;

-- ===========================================================================
-- RESET (optionnel) — pour tout effacer AVANT de reséeder, décommentez :
-- ===========================================================================
-- truncate table accounts, people, ateliers, groups, events, reports, conversations, notifications;
