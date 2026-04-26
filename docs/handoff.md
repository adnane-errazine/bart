# Handoff

> One short file shared between devs. **Overwrite** at end of session — do not append a wall.
> Read this + `git log --oneline -20` at start of every session.

**Last touched:** Rémi · 2026-04-26

---

## Just done

### Datasets ready for the demo
- **`data/art_auction_dataset.csv`** : 1003 ventes (1000 base + 3 reventes ajoutées pour BNK001).
- **`data/artworks.csv`** (NOUVEAU, 1000 lignes) : metadata complète par œuvre — title, year, medium, dims, description, style, notable_owners, bart_score. Schema aligné avec `architecture.md`. Mix d'œuvres réelles documentées (233, dont *Girl with Balloon*, *Femmes d'Alger Version O*, *Shot Sage Blue Marilyn*, *L'Homme qui marche I*…) et œuvres plausibles cohérentes avec chaque artiste (767). Garantie : `year_created ≤ première sale_date`.
- **Repeat-sales démo** : BNK001 = *Girl with Balloon → Love is in the Bin* avec 4 ventes documentées (2014 €52K → 2017 €182K → 2018 €1.18M post-shredding → 2021 €21.85M). Permet de démontrer le RSR sur un cas iconique connu du jury.

### Scripts générateurs (idempotents, dans `scripts/`)
- `gen_artworks.py` — produit `data/artworks.csv` à partir de `data/art_auction_dataset.csv`. Re-runner si on ajoute des artistes ou des œuvres.
- `add_repeat_sales.py` — append-only des reventes BNK001. Skip si déjà présent.

### Stratégie démo confirmée (cf. session précédente)
- Frontend = source de vérité visuelle (`lib/data.ts` reste le mock UI).
- Backend = 2 endpoints IA stateless : `/chat` (existe, basique) + `/anomaly` (à construire).
- Pas de Supabase / Qdrant pour la démo. Le backend lit les 2 CSV en mémoire.
- 2 features IA prioritaires : **chat global** (Research) + **anomaly explainer** (Markets / ArtworkPage).
- Web search Claude : NON pour la démo (latence + imprévisibilité). Mention dans la roadmap pitch suffit.
- Local Mistral : NON pour la démo (qualité narrative bien inférieure). Mention slide enterprise.

## Up next (priority order)

1. **Refactor backend pour lire les 2 CSV en mémoire** au démarrage FastAPI (remplacer la lecture Supabase). `services/dataset.py` à créer.
2. **Adapter les tools de l'agent** (`agents/tools.py`) pour requêter ce dict en mémoire au lieu d'asyncpg + Qdrant. Garde l'interface, change l'impl.
3. **Endpoint `POST /api/v1/anomaly`** : prend `{artist_name?, category?, artwork_id?}`, récupère 5-10 ventes récentes avec leur `price_change_explanation`, demande à Claude une synthèse narrative. ~1h.
4. **Streaming SSE** sur `POST /chat` pour effet « live thinking ». Modifier `chat.py` + le client `lib/api.ts`.
5. **Brancher anomaly dans MarketsPage** (panneau Anomaly Insights) + ArtworkPage (bouton « Why did it move? »).
6. **Audit boutons morts du frontend** — la majorité doivent au moins faire `navigate()`. Rapide à passer en revue.

## Gotchas / hypotheses

- **Frontend mock vs CSV mismatch** : `lib/data.ts` utilise IDs comme `bull-quaver-2022`, segment `Street & Urban`. Les CSV utilisent `BNK001`, category `Street Art`. **Ne pas tenter d'aligner** — la démo affiche le mock côté UI, le backend AI tape sur les CSV pour les questions ouvertes.
- **Méthodologie pitch** : avec ce dataset on n'a qu'UNE œuvre repeat-sales (BNK001). Pour le pitch RSR, on peut soit (a) reformuler en « moyenne pondérée + hédonique » (plus honnête), soit (b) ne montrer le RSR que sur Girl with Balloon comme proof-of-concept. Décision en attente.
- **Filler artworks** : 767 sur 1000 ont des titres synthétiques (pattern `Untitled (Stencil) #21`). Si l'agent les remonte trop, on peut filtrer sur les 233 œuvres réelles dans le tool `search_artworks` via un flag `real_works_only`.
- `frontend/CLAUDE.md` warns Next.js 16 has breaking changes vs training data → check `node_modules/next/dist/docs/` before non-trivial frontend changes.
- `agents/global_chat.py` uses raw Anthropic SDK (not PydanticAI as `architecture.md` claims). Stick with raw SDK for hackathon.
- Fichier `data/art_auction_dataset.csv:Zone.Identifier` (artefact Windows) à supprimer si présent.
- `data/html/` et `data/sales/` (4 MB, untracked) = scraps locaux, à `.gitignore` si on veut nettoyer.

## Files touched this session

- `data/artworks.csv` (créé, 1000 rows)
- `data/art_auction_dataset.csv` (3 lignes ajoutées en fin)
- `scripts/gen_artworks.py` (créé)
- `scripts/add_repeat_sales.py` (créé)
- `docs/handoff.md` (cette mise à jour)
- `frontend/app/globals.css` (fix overflow sidebar — session précédente, non commit)
- `claude.md` (session protocol — session précédente, non commit)
