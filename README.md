# Portfolio — Daniel CHABI BOUKO

Portfolio professionnel « **Le Registre** » : la carrière d'un archiviste
2.0 mise en page comme un fonds d'archives — cotes, tampons, registres,
papier ivoire et vermillon. Les **projets sont alimentés automatiquement
par l'API GitHub**, le contenu éditable (articles, compétences, parcours,
profil, messages) vit dans **Vercel Blob**, et l'administration se fait
par **identifiant + mot de passe** — aucune base de données externe.

**Stack** : Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 ·
Motion (animations 2D — plus aucune scène 3D) · Vercel Blob (contenu,
images, messages) · Resend (emails de contact) · API GitHub (projets).

---

## 1. Démarrage rapide (développement)

```bash
npm install
cp .env.local.example .env.local   # puis renseigner les valeurs (voir ci-dessous)
npm run dev                        # http://localhost:3000
```

> Tant que Vercel Blob n'est pas configuré (`BLOB_READ_WRITE_TOKEN`
> absent), le site s'affiche avec le **contenu par défaut** intégré
> (profil, compétences, parcours, un article) et l'admin refuse la
> connexion tant que `ADMIN_USERNAME` / `ADMIN_PASSWORD` ne sont pas
> définis. Les projets, eux, sont lus depuis GitHub — avec un repli
> hors-ligne si l'API est injoignable au premier build.

## 2. Les projets : alimentés par GitHub

La page Projets ne se maintient pas à la main. `src/lib/github.ts` lit
les dépôts publics de `DanitechChabi` via l'API GitHub, côté serveur,
**mis en cache une heure** (data cache de Next) : aucune requête par
visiteur, donc pas de rate-limit en pratique.

Pour chaque dépôt conservé, le site affiche : cote d'archive
(`PRJ·2026·NN`), nom, description, langages (ventilés en octets), date
de dernière activité, lien du repo et lien de démo (le champ *homepage*
du dépôt fait foi).

La curation se règle dans **`src/content/projects.config.ts`** :

| Réglage | Rôle |
|---|---|
| `EXCLUDED_REPOS` | dépôts à masquer (tests, brouillons…) |
| `INCLUDE_NO_DESCRIPTION` | dépôts sans description à afficher quand même |
| `REPO_OVERRIDES` | par dépôt : description enrichie, URL de démo de repli, casquettes (archives / data / dev), points forts, mini-graphique |
| `FEATURED_ORDER` | dépôts mis en avant, dans l'ordre |

Sont automatiquement écartés : les forks, les dépôts archivés et ceux
sans description (sauf liste blanche). Les casquettes sont devinées à
partir du nom/description quand l'override ne les fixe pas.

**Ajouter un projet = pousser un repo GitHub avec une description.** Au
besoin, trois lignes dans `REPO_OVERRIDES` pour l'enrichir (démo,
casquettes, points forts, graphe de la page détail).

### Variable optionnelle

`GITHUB_TOKEN` (fine-grained, lecture publique suffit) augmente le
plafond de requêtes API de 60 à 5 000/h — utile uniquement si le nombre
de dépôts grimpe. Sans elle, tout fonctionne.

## 3. Stockage Vercel Blob & connexion admin

### Vercel Blob

1. Sur [vercel.com](https://vercel.com), ouvrir le projet → **Storage →
   Create Database → Blob** (l'offre Hobby suffit).
2. Copier la **Read/Write Token** → `BLOB_READ_WRITE_TOKEN` (locale
   `.env.local` et production Vercel).

Le contenu vit en JSON dans le store :

| Chemin | Contenu |
|---|---|
| `data/profile.json` | profil (accueil, à propos) |
| `data/posts.json` | articles — brouillons compris |
| `data/skills.json` | compétences (trois pôles) |
| `data/experiences.json` | parcours professionnel |
| `messages/{uuid}.json` | un fichier par message reçu, à nom aléatoire |
| `newsletter/{uuid}.json` | un abonné à la newsletter, à nom aléatoire |
| `media/{folder}/…` | images téléversées |

Tant qu'un fichier n'a **jamais été écrit**, le site public sert le
contenu par défaut embarqué dans `src/lib/default-content.ts` ; le
premier enregistrement admin **matérialise ces valeurs par défaut dans
le store**, puis les modifications font foi. Supprimer la dernière
compétence affiche bien une liste vide — pas un retour aux valeurs par
défaut. Un fichier écrit mais vide (`[]`) est une donnée à part entière.

**Confidentialité** : Vercel Blob ne propose plus de blobs privés —
tout est servi par URL publique, mais le store n'est **pas listable**
sans le token serveur. Concrètement : les fichiers à nom prévisible
(`data/posts.json`) sont lisibles par quiconque connaît l'URL du store,
donc **pas de contenu sensible dans les brouillons** ; les messages
(nom, email) portent un UUID de nom de fichier — introuvables sans le
token. Les images sous `media/` sont publiques par design.

### Connexion admin (identifiant + mot de passe)

`/admin` est protégé par `ADMIN_USERNAME` / `ADMIN_PASSWORD`. La session
est un cookie signé (HMAC-SHA256, `httpOnly`, 7 jours) — changer le
mot de passe **déconnecte toutes les sessions** ouvertes. Un secret
dédié `SESSION_SECRET` est optionnel : sans lui, la signature est dérivée
de l'identifiant et du mot de passe.

Les tentatives de connexion sont limitées (5 par minute et par IP).

## 4. Configuration de Resend (formulaire de contact)

1. Créer un compte sur [resend.com](https://resend.com) (3 000 emails/mois
   gratuits).
2. Ajouter et vérifier un domaine (ou utiliser `onboarding@resend.dev` pour
   tester).
3. Créer une **API Key** → `RESEND_API_KEY`.
4. Définir l'adresse de réception → `CONTACT_EMAIL`.

Chaque message envoyé via le formulaire part par email **et** est
archivé dans le store (`messages/`) — consultable dans l'admin même si
l'email échoue.

## 5. L'Archiviste — assistant conversationnel du site public

Un chat incarné par « L'Archiviste », le commis qui conserve le registre :
il répond aux visiteurs (recruteurs, clients) sur le parcours, les
compétences, les projets et les articles — **en ne s'appuyant que sur le
contenu réel du site**, jamais inventé.

1. Créer un compte sur [openrouter.ai](https://openrouter.ai), puis une
   **API Key** → `OPENROUTER_API_KEY`.
2. Renseigner la variable dans `.env.local` (et côté Vercel en production).
   Clé serveur uniquement — jamais de préfixe `NEXT_PUBLIC_`.
3. Redéployer : le sceau vermillon « A. » apparaît en bas à droite des
   pages publiques. Sans la clé, le widget n'est pas dans les pages et la
   route répond que la salle de lecture est fermée.

**Comment ça marche.** Le serveur reconstitue toutes les dix minutes un
« FONDS » — profil, compétences, parcours, projets GitHub, articles — à
partir des mêmes sources que les pages (`src/lib/chat.ts`). Le modèle le
reçoit avec des règles strictes : tenir le ton de l'office, ne répondre
que du fonds, avouer ce qui n'y figure pas, rediriger les demandes
concrètes vers le formulaire de contact. Les réponses arrivent en flux
(SSE) sous un curseur d'encre ; la conversation ne survit pas au
rafraîchissement — rien n'est stocké, seules les erreurs techniques sont
journalisées, jamais le contenu.

**Garde-fous** : question plafonnée à 800 caractères, historique tronqué
à 8 tours côté serveur, sortie plafonnée à 400 tokens, 5 messages/min/IP
et 50 consultations/jour/navigateur (cookie signé HMAC), honeypot
anti-robots, repli in-character si le fournisseur est en panne.

**Modèle** : `z-ai/glm-5.3-flash` par défaut (~$0,0004 la réponse, plafond
absolu ≈ $0,62/mois au quota plein). Bascule via `AI_CHAT_MODEL` sans
redéploiement ; coupure rapide via `AI_CHAT_ENABLED=false`.

## 6. Variables d'environnement

Voir `.env.local.example`. En production, les renseigner dans **Vercel →
Settings → Environment Variables** :

| Variable | Rôle |
|---|---|
| `ADMIN_USERNAME` | Identifiant de connexion `/admin` |
| `ADMIN_PASSWORD` | Mot de passe de connexion `/admin` |
| `SESSION_SECRET` | *(optionnel)* secret de signature des sessions |
| `BLOB_READ_WRITE_TOKEN` | Store Blob : contenu admin, images, messages |
| `RESEND_API_KEY` | Envoi des emails de contact |
| `CONTACT_EMAIL` | Adresse qui reçoit les messages |
| `NEXT_PUBLIC_SITE_URL` | URL publique (SEO, emails) |
| `GITHUB_TOKEN` | *(optionnel)* plafond API GitHub pour les projets |
| `OPENROUTER_API_KEY` | Clé OpenRouter du chat « L'Archiviste » (§ 5) |
| `AI_CHAT_MODEL` | *(optionnel)* modèle du chat — défaut `z-ai/glm-5.3-flash` |
| `AI_CHAT_ENABLED` | *(optionnel)* `false` coupe le chat sans redéploiement |

## 7. Utiliser l'interface admin

Rendez-vous sur **`/admin`** et connecte-toi avec l'identifiant et le
mot de passe définis dans l'environnement.

- **Profil** — nom, titre, accroche, bio, photo, liens sociaux.
- **Blog** — articles en markdown (aperçu intégré), brouillons et publication.
- **Compétences** — trois pôles, niveau sur 5 (carrés de tampon), ordre.
- **Parcours** — postes et stages : cote, période, type, casquettes,
  réalisations (une par ligne).
- **Messages** — messages reçus via le formulaire de contact, lu/non lu.
- **Newsletter** — abonnés à « Le Bordereau » collectés par le popup du site
  public (s'ouvre après 8 s de lecture, 30 % de page parcourue ou une
  intention de sortie — le curseur qui fuit vers le haut de la fenêtre ;
  un refus le calme 7 jours, une inscription le retire définitivement ;
  le lien « Newsletter » du pied de page le rouvre à la demande). À
  l'inscription, le tampon claque : onde d'impact, éclaboussures d'encre
  et secousse du papier. Export CSV pour alimenter un outil d'envoi
  (Resend Audiences, Buttondown…).

> **Projets** : l'onglet n'existe pas dans l'admin — les fiches projets se
> synchronisent toutes seules depuis GitHub (voir § 2). La curation se
> fait dans `src/content/projects.config.ts`, pas dans le store.

Les images sont téléversées dans Vercel Blob sous `media/` (accès public)
via le bouton de téléversement des formulaires.

## 8. Déploiement sur Vercel

1. Pousser le repo sur GitHub (`git init && git add -A && git commit -m
   "Portfolio" && git remote add origin … && git push -u origin main`).
2. Importer le projet sur Vercel, renseigner les variables d'environnement.
3. Créer la base **Blob** (§ 3) et coller sa token dans les variables.
4. Déployer. Le domaine `danielchabi.vercel.app` s'active automatiquement.

## 9. Structure du projet

```
src/
├── app/
│   ├── (site)/            # site public (Header + Footer)
│   │   ├── page.tsx       # accueil : hero, à propos, compétences,
│   │   │                  #   parcours, projets (GitHub), contact
│   │   ├── projets/[slug] # fiche projet : aperçu live iframe, graphe,
│   │   │                  #   composition du code, fiche technique
│   │   └── blog/          # liste + articles
│   ├── admin/             # interface d'administration (identifiant/mdp)
│   │   ├── login/         # connexion (identifiant + mot de passe)
│   │   └── (protected)/   # tableau de bord, articles, compétences,
│   │                      #   parcours, messages, newsletter, profil
│   ├── api/contact/       # Route Handler : Resend + archivage Blob
│   ├── api/newsletter/    # Route Handler : inscription « Le Bordereau »
│   ├── api/chat/          # Route Handler : streaming SSE → OpenRouter
│   │                      #   (limites minute/jour, honeypot, replis)
│   ├── opengraph-image.tsx   # fiche de partage 1200×630 (accueil, repli
│   │                          # global) — voir src/og/
│   ├── layout.tsx         # polices, métadonnées globales
│   └── template.tsx       # transition de page (fade + slide)
├── og/                    # images OpenGraph : cadre « Le Registre »,
│   ├── frame.tsx          #   polices statiques TTF (Satori), sceau,
│   └── fonts/             #   cotes — chaque route peut avoir sa fiche
│                          #   via un fichier opengraph-image.tsx local
├── components/            # home/ projects/ blog/ newsletter/ chat/ layout/ ui/ admin/
│   └── chat/              #   ArchivistChat : sceau-bouton + salle de lecture
├── content/
│   ├── projects.config.ts # curation GitHub : overrides, exclusions, phares
│   └── parcours.ts        # formations (les expériences passent par le store)
├── lib/
│   ├── store.ts           # store Vercel Blob (JSON + images)
│   ├── admin-actions.ts   # server actions : mutations de l'admin
│   ├── auth.ts            # sessions signées HMAC, vérification identifiants
│   ├── data.ts            # lectures publiques (store → replis par défaut)
│   ├── chat.ts            # chat : règles + FONDS reconstruit (TTL 10 min)
│   ├── chat-quota.ts      # chat : quota journalier (cookie signé HMAC)
│   ├── default-content.ts # contenu par défaut (point de départ du store)
│   ├── github.ts          # lecture des dépôts GitHub (cache 1 h)
│   └── chart-palette.ts   # couleurs des graphiques (langages, séries)
└── types/                 # types partagés
```

**Aperçu au partage des liens** : WhatsApp, LinkedIn, X et Facebook
lisent `og:image` — chaque page servait déjà `og:title`/`og:description`,
elles servent désormais une fiche 1200×630 générée par `next/og`
(Satori + resvg). Accueil et blog sont prérendus au build ;
articles et fiches projet sont générés à la demande (ISR, même rythme que
la page). Les polices TTF statiques vivent dans `src/og/fonts/` (Satori
n'accepte ni polices variables ni variables CSS) et sont tracées dans le
build par le bundler.

## 10. Direction artistique — « Le Registre »

Papier ivoire (`#f2ede0`), encre profonde (`#211c13`), vermillon tampon
(`#c0391b`) ; une encre par casquette : **vermillon = archiviste**,
**cyanotype (`#2c4e6e`) = data**, **vert de repérage (`#2f5d48`) = dev**.
Typographies : Fraunces (titres, axes SOFT/WONK), IBM Plex Sans (texte),
IBM Plex Mono (cotes et métadonnées). Chaque section porte une cote
(`DCB·2026·01…06`), les projets sont cotés `PRJ·2026·NN`.

Les couleurs des graphiques (barres de langages, mini-charts) vivent
dans `src/lib/chart-palette.ts` et suivent les contrôles du skill
dataviz (clarté, chroma, séparation daltonienne, contraste) :

```bash
npm run palette:check   # valide src/lib/chart-palette.ts (six contrôles)
```

À relancer après toute retouche de ces valeurs.

## 11. Commandes

```bash
npm run dev     # développement (Turbopack)
npm run build   # build de production
npm run start   # serveur de production
npm run lint    # ESLint
```
