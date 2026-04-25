Voilà le brief complet à envoyer à ton équipe. Format direct, actionnable, avec les rôles, le pitch et la vision claire. Tu peux le copier-coller tel quel dans votre Slack/Discord/WhatsApp.

🎨 PROJET HACKATHON — ART INDEX TERMINAL
Théme : Fintech
Durée : 24h
Équipe : 2 devs, 2 financiers, 1 juriste
Catégorie pitch : Infrastructure de marché / Analytics institutionnelle / Insurtech-adjacent

1. L’IDÉE EN UNE PHRASE
On construit le Bloomberg Terminal du marché de l’art : une plateforme d’indices, d’analytics et de simulation qui transforme l’art — un marché de 65 milliards de dollars annuels resté opaque et fragmenté — en classe d’actifs lisible et benchmarkable pour la finance institutionnelle.

2. LE PROBLÈME
Le marché de l’art est la dernière grande classe d’actifs alternatifs non-financiarisée.



|Asset class        |Indices tradables|Dérivés|ETF          |
|-------------------|-----------------|-------|-------------|
|Equities ($100T)   |✅                |✅      |✅            |
|Real estate ($380T)|✅                |✅      |✅            |
|Commodities ($20T) |✅                |✅      |✅            |
|Crypto ($3T)       |✅                |✅      |✅ depuis 2024|
|**Art ($65B/an)**  |❌                |❌      |❌            |

Conséquence concrète :
	•	Un family office qui veut allouer 5% à l’art doit acheter physiquement des œuvres
	•	Un fonds qui détient des œuvres ne peut pas hedger
	•	Une banque qui prête contre des œuvres ne peut pas suivre la valeur du collateral en temps réel
	•	Un asset manager ne peut pas offrir d’exposition art à ses clients sans monter un fonds illiquide à 7 ans de lock-up
Les outils existants sont soit des bases de données brutes (Artnet), soit des publications statiques semestrielles (Mei Moses), soit des rapports lents et chers (ArtTactic). Aucun n’est un outil de travail quotidien pour un PM, un risk manager, ou un advisor patrimoine.

3. LA SOLUTION
Une plateforme web qui combine quatre couches :
Couche 1 — Indices propres
5 indices sectoriels calculés en temps réel sur données d’enchères publiques :
	•	Blue Chip (morts célèbres : Picasso, Warhol, Monet)
	•	Modern Masters (Hockney, Richter)
	•	Ultra-Contemporary (artistes vivants post-2010)
	•	Photography (Gursky, Sherman)
	•	Street Art (Banksy, KAWS)
Méthodologies utilisées en parallèle : Repeat-Sales Regression (méthode Case-Shiller / Mei Moses) et Régression hédonique (méthode Renneboog-Spaenjers).
Couche 2 — Trading Desk Simulator
Interface type Bloomberg permettant de simuler des positions long/short cross-segments. Backtest sur 5-10 ans. Comparaison vs benchmarks classiques (S&P 500, Gold, Bitcoin). Métriques affichées : P&L, Sharpe ratio, max drawdown, corrélations.
Couche 3 — Quatre agents IA
	1.	Data Enrichment Agent : enrichit chaque transaction avec contexte (expos, provenance, presse, collections institutionnelles)
	2.	Anomaly Detection & Insight Agent : détecte les mouvements anormaux et explique pourquoi le marché bouge
	3.	Portfolio Construction Agent : construit une allocation art personnalisée à partir du portfolio existant du client
	4.	Conversational Research Agent : assistant chat branché sur les données + le web, répond à n’importe quelle question en langage naturel avec graphiques générés
Couche 4 — API B2B
Endpoints pour licensing aux fonds d’art (NAV pricing), banques privées (collateral monitoring), assureurs (valuation continue).

4. POURQUOI C’EST DIFFÉRENT
Notre wedge se résume en une phrase : on traduit le marché de l’art dans le langage natif de la finance institutionnelle.
Pas de blockchain, pas de tokenisation, pas de fractionnalisation. Tous les acteurs qui ont essayé ces angles (Maecenas, Particle, Artex, Look Lateral) ont échoué — soit le marché secondaire ne se forme jamais, soit le prix token diverge violemment du prix de réalisation. Notre angle volontairement plus modeste — l’infrastructure analytique — est le seul qui scale.
Notre référence intellectuelle : MSCI dans les années 70-80. MSCI n’a jamais tradé une seule action. Il a juste construit le rail d’indices qui a permis à toute l’industrie ETF d’émerger. On fait la même chose pour l’art.

5. POURQUOI L’IA EST LA CONDITION D’EXISTENCE DU PRODUIT
Sans IA, on serait un meilleur Artprice. Avec nos quatre agents, on devient l’OS du marché de l’art financiarisé. Chaque agent remplace un service humain coûteux et lent :



|Agent                  |Remplace                            |Coût/temps évité                |
|-----------------------|------------------------------------|--------------------------------|
|Data Enrichment        |Recherche manuelle d’analyste junior|30 min/lot → 5 sec/lot          |
|Anomaly Insight        |Buy-side analyst                    |300K$/an                        |
|Portfolio Construction |Art advisor                         |5K$ et 3 semaines par allocation|
|Conversational Research|Equity research analyst             |Capacité de query infinie 24/7  |

À pitcher comme suit : “Nos agents ne sont pas une feature. Sans eux, ce produit n’existerait pas — on serait juste un dashboard de plus.”

6. CIBLES CLIENTS ET BUSINESS MODEL
Tier 1 — Pro SaaS : 499$/mois
Cible : 50 000 family offices et art advisors globalement
TAM : 300M$ ARR
Tier 2 — Enterprise API : 5–15K$/mois
Cible : 200 fonds d’art (Masterworks, Yieldstreet Art, Artemundi, Anthea), banques privées (Sotheby’s Financial, Citi Art Advisory, JP Morgan Art Lending), assureurs (Hiscox, AXA Art, Chubb Fine Art)
TAM : 24M$ ARR direct
Tier 3 — Index Licensing (vision long terme)
Cible : sponsors d’ETF (WisdomTree, Invesco) pour création des premiers ETF Fine Art
Précédent : MSCI génère 2.3B$ de revenu annuel principalement via licensing d’indices à des sponsors d’ETF
Précédent stratégique fort : Mei Moses a été racheté par Sotheby’s en 2016 pour acquérir le leadership d’index. Personne n’a encore construit la version trading-grade. La fenêtre est ouverte.

7. RÉPARTITION DE L’ÉQUIPE SUR 24H
Dev 1 — Backend / Data (10h de code)
Responsable : données + calcul d’indices + agents IA backend
	•	H+0 → H+2 : génération du dataset mocké (500 transactions sur 10 ans, 5 segments) via prompt à Claude/GPT pour CSV réaliste
	•	H+2 → H+5 : implémentation Repeat-Sales Regression en Python (statsmodels)
	•	H+5 → H+7 : implémentation Régression hédonique
	•	H+7 → H+9 : API FastAPI exposant les indices + endpoint backtest + endpoint chat agentic
	•	H+9 → H+10 : intégration Claude API avec function calling (tool use) pour Agent 4 (Conversational Research)
Dev 2 — Frontend / Dashboard (12h de code)
Responsable : Bloomberg Terminal UX + intégration agents IA frontend
	•	H+0 → H+3 : setup Next.js 14 + Tailwind + shadcn/ui + Recharts, layout général dark theme type Bloomberg
	•	H+3 → H+7 : composants visualisation indices (multi-line chart, sélecteur de période, tooltips avancés)
	•	H+7 → H+10 : panneau “Trade Ticket” + visualisation backtest P&L + comparaison benchmarks
	•	H+10 → H+12 : interface chat agentic + panneau “Anomaly Insights” + polish UI/UX final
Financier 1 — Pitch & Storytelling (8h)
Responsable : transformer la démo en histoire qui vend
	•	H+0 → H+3 : recherche marché et sourcing chiffres précis
	•	Taille marché art : Art Basel/UBS Art Market Report 2025
	•	AUM Masterworks, fees Sotheby’s Financial Services
	•	Comparables valorisation : MSCI, Bloomberg, eFront, PitchBook
	•	H+3 → H+5 : construction deck (10-12 slides max)
	•	H+5 → H+7 : répétition pitch chronométrée (target : 2’45)
	•	H+7 → H+8 : préparation Q&A jury
Financier 2 — Modélisation business & TAM (8h)
Responsable : crédibilité chiffrée du business model
	•	H+0 → H+3 : modèle TAM/SAM/SOM rigoureux. Benchmarks willingness to pay : Bloomberg Terminal (24K￼/mois), PitchBook (15-30K$/an)
	•	H+3 → H+6 : slide “Business Model” avec 3 tiers de pricing + projections clients année 1/2/3 sourcées
	•	H+6 → H+8 : préparation des réponses aux questions financières probables, support du pitcher
Juriste — Réglementation & Roadmap (6h) ⭐ NOTRE ARME SECRÈTE
Avoir un juriste dans une équipe hackathon fintech est exceptionnel. Le mettre en avant dans le pitch est un différenciateur énorme.
	•	H+0 → H+3 : note de conformité
	•	Confirmer que produire/vendre des indices d’analyse ne tombe pas sous la régulation des produits financiers
	•	Confirmer que les simulations ne constituent pas du conseil en investissement
	•	Rédiger le disclaimer de la démo : “For informational purposes only. Not investment advice.”
	•	H+3 → H+6 : roadmap réglementaire 24 mois
	•	Étapes pour passer de “data analytics” à “vrai produit dérivé” (agrément AMF, MTF, partenariat sponsor d’ETF)
	•	Comparaison avec précédents : MSCI (research → licensing ETF), Liv-ex (vin de garde)
	•	Slide “Regulatory Roadmap” — personne ne fait ça en hackathon, ça impressionne énormément

8. CALENDRIER 24H



|Heure          |Devs                           |Financiers                             |Juriste              |
|---------------|-------------------------------|---------------------------------------|---------------------|
|H+0 → H+4      |Setup + dataset + backend      |Recherche marché + deck v1             |Note conformité      |
|H+4 → H+8      |Calcul indices + dashboard     |Itération deck + business model        |Roadmap réglementaire|
|H+8 → H+12     |Backtest + agent IA + polish   |Répétition pitch                       |Coaching réponses Q&A|
|**H+12 → H+16**|**PAUSE / SOMMEIL OBLIGATOIRE**|**idem (sauf pitcher : 4h sleep mini)**|**idem**             |
|H+16 → H+20    |Bug fixing + intégration finale|Répétition + chronométrage             |Validation finale    |
|H+20 → H+23    |Polish + déploiement + dry-run |Pitch final                            |Support technique Q&A|
|H+23 → H+24    |**PITCH**                      |**PITCH**                              |**PRÉSENT**          |

Règle absolue : tout le monde dort entre H+12 et H+16. Un pitcher fatigué perd un hackathon.

9. STACK TECHNIQUE

Frontend     : Next.js 14 (App Router) + Tailwind + shadcn/ui + Recharts
Backend      : FastAPI (Python) + statsmodels + scikit-learn
Database     : SQLite ou Supabase (selon préférence)
LLM          : Claude API (Sonnet 4.6) avec function calling
Deploy       : Vercel (front) + Railway/Render (backend)


10. LE PITCH — STRUCTURE 3 MINUTES
0:00 → 0:30 — Hook
“En 2024, le marché de l’art a brassé 65 milliards de dollars. Plus que le whisky, plus que les montres de luxe. Pourtant, si vous êtes gérant d’un family office et que votre client veut s’exposer à l’art contemporain, vous avez exactement deux options : acheter un Basquiat à 20 millions et le stocker au Geneva Freeport, ou ne rien faire. Pas d’ETF. Pas d’index futures. Pas de hedging. L’art est la dernière classe d’actifs majeure qui n’a jamais été financiarisée.”
0:30 → 1:00 — Pourquoi maintenant
“Le vide existe pour une raison : le marché de l’art est opaque, fragmenté entre maisons de ventes, et les indices existants comme Mei Moses ou Artprice sont pensés comme outils de recherche, pas comme infrastructure de marché. Mais trois forces convergent : l’émergence de fonds d’art régulés comme Masterworks qui pèsent maintenant plus d’un milliard sous gestion, la maturation des LLM qui permettent enfin d’extraire du signal des données fragmentées, et la demande croissante d’expositions alternatives liquides post-2022. Le rail manque. On le construit.”
1:00 → 2:15 — Démo live
	1.	Ouvre le dashboard sombre, vue 5 indices
	2.	Clique sur Ultra-Contemporary, montre la courbe sur 10 ans
	3.	Pointe les chiffres : ”+247% sur 10 ans, vs +180% pour le S&P. Sharpe 0.8 contre 1.1 pour le S&P. Volatil mais accrétif et faiblement corrélé.”
	4.	Ouvre le Trade Ticket : long Ultra-Contemporary, short Old Masters, 1M$ notionnel
	5.	Lance le backtest : courbe P&L apparaît
	6.	Clique sur “Why is Street Art up?” → l’agent génère une analyse en streaming
	7.	Bonus : tape dans le chat “Compare Banksy vs KAWS sur 5 ans, dis-moi qui est sur-évalué” → réponse + graphique en live
2:15 → 2:45 — Business Model
“Trois revenus immédiats. Premier : SaaS analytics à 500 dollars par mois pour les family offices et art advisors, marché de 50 000 cibles globalement. Deuxième : API enterprise à 10 000 dollars par mois pour les fonds d’art qui doivent pricer leur NAV — Masterworks seul a besoin de ce produit. Troisième : licensing d’indices aux sponsors d’ETF pour la création des premiers ETF Fine Art régulés. C’est exactement le business model de MSCI : 2.3 milliards de revenu annuel, principalement via licensing d’indices.”
2:45 → 3:00 — Close
“Mei Moses a été racheté par Sotheby’s en 2016 pour mettre la main sur l’index leadership. Personne n’a encore construit la version trading-grade avec une couche d’agents IA. C’est ce qu’on fait. Notre équipe inclut un juriste qui a stress-testé la conformité du produit dès la conception — voici notre roadmap réglementaire sur 24 mois. Merci.”

11. RÉPONSES AUX QUESTIONS PROBABLES DU JURY
Q : “Comment vous monétisez vraiment si personne ne peut trader ces indices ?”
“Trois revenus immédiats déjà chiffrés : SaaS analytics, API NAV, data licensing. La création d’instruments tradables réels viendra V2 via partenariat sponsor d’ETF. Le rail data est le prérequis.”
Q : “Vos indices sont basés sur quoi ?”
“Sur les transactions publiques d’enchères, qui représentent ~50% du marché en valeur. Deux méthodologies en parallèle : repeat-sales regression à la Case-Shiller pour la robustesse, régression hédonique à la Renneboog-Spaenjers pour les caractéristiques. En production, connexion à Artnet ou Artprice via licence (3K€/an).”
Q : “Pourquoi personne ne l’a fait avant ?”
“Mei Moses l’a fait en research, racheté par Sotheby’s. Artprice l’a fait en publication, listé en bourse. Personne n’a fait le pas vers le trading desk : combiner indices + analytics + simulation + UX adapté aux pros + agents IA. Trois conditions ont changé : maturité des LLM, apparition de Masterworks comme client institutionnel B2B, demande post-2022 d’exposures alternatives liquides.”
Q : “Et la liquidité réelle pour fermer une position long/short ?”
“Aujourd’hui zéro, parce que les indices ne sont pas tradables. Notre V1 est analytique : modélisation d’expositions synthétiques sur portfolios existants. La V2 sera la création de produits dérivés OTC en partenariat avec une banque. C’est exactement comme ça que MSCI a démarré avant que les futures sur indices émergent dans les années 80.”
Q : “Concurrence ?”
“Mei Moses (Sotheby’s) et Artprice sur la donnée mais en outils de research statiques. Limna AI sur le pricing individuel mais pas indices. Wondeur AI sur l’analytics carrière. Personne en infrastructure trading-grade avec agents IA. Fenêtre ouverte.”
Q : “TAM précis ?”
“50 000 family offices à 500￼. 200 fonds d’art / wealth managers à 10K￼ ARR. Plus le licensing ETF avec upside non chiffrable. Au total, wedge sous-exploité d’un marché de 65 milliards de transactions annuelles.”

12. RÈGLES D’EXÉCUTION
	1.	Aucun mot sur “blockchain” ou “tokenisation” dans le pitch, sauf si question. On se différencie volontairement de l’océan de projets crypto vides.
	2.	Toujours citer 2-3 noms concrets dans le pitch (Masterworks, Mei Moses, Sotheby’s Financial). Signal de connaissance terrain.
	3.	Toujours terminer par une analogie historique (MSCI, Bloomberg, Liv-ex). Les jurys retiennent les analogies.
	4.	Avoir un fallback hardcodé pour la démo en cas de bug live. Indices pré-calculés stockés en JSON statique.
	5.	Mettre en avant le juriste au moins une fois dans le pitch. C’est un différenciateur unique.
	6.	Pitcher : 4h de sommeil minimum entre H+12 et H+16. Non négociable.

13. NEXT STEPS IMMÉDIATS
	•	Validation de l’angle par toute l’équipe (30 min)
	•	Setup repos GitHub + canaux de communication (15 min)
	•	Lancement timer 24h
	•	Stand-ups toutes les 4h (15 min max chacun)

Let’s ship.

Voilà. Tu peux balancer ça tel quel dans votre canal d’équipe. Si tu veux que je te génère en parallèle le prompt précis pour générer le dataset mocké via Claude, le code Python complet de la repeat-sales regression, ou le squelette du chat agentic avec function calling, dis-le moi et je sors ça en 5 minutes.