# Glossary — Code Rouge

Plain-French translations of every technical term you'll encounter in this
project. Useful when you need to explain something to Nathanael or write
user-facing copy.

---

**Monorepo**
Un seul dépôt GitHub contenant les trois applications + le serveur, plutôt
que quatre dépôts séparés. Avantage : tout évolue ensemble, pas de versions
désynchronisées.

**Design system**
Bibliothèque centrale des couleurs, polices, boutons, icônes définis par la
graphiste. Garantit que les trois apps se ressemblent visuellement et que
toute modif de charte se propage en un seul endroit.

**Pipeline CI**
Robot qui, à chaque modification de code, lance automatiquement : vérification
de syntaxe (lint), vérification des types (typecheck), tests unitaires, puis
fabrication des installateurs. Si une étape échoue, le code est refusé.

**Mode kiosque**
L'app occupe 100 % de l'écran et tous les boutons « sortie » du système
(Home, Alt+Tab, touche Windows…) sont neutralisés. Le joueur est verrouillé
dans le jeu, comme sur une borne d'arcade.

**WebSocket**
Canal temps réel entre les apps et le serveur NUC. Permet à « Débriefing »
de récolter les logs des deux autres apps en fin de session, sans
rafraîchissement manuel.

**SQLite**
Mini base de données locale, stockée dans un seul fichier sur le NUC.
Conserve l'identifiant équipe, le score, l'étape en cours, et permet la
reprise après redémarrage.

**Persistance d'état**
Le fait que l'application se souvienne de tout ce qu'elle faisait, même
après une coupure brutale. Testé en débranchant volontairement chaque appareil.

**Build / APK / exécutable signé**
Fichiers d'installation. APK pour Android, .exe pour Windows. *Signés* veut
dire : certifiés authentiques par une clé cryptographique, pour que Android
et Windows acceptent de les installer sans bloquer.

**Screen Pinning (Android)**
Mécanisme Android qui verrouille l'utilisateur dans une seule app. Activé
par le code via la permission `LOCK_TASK`. En production, on utilise le
mode "device-owner" qui rend ce verrou non-désactivable même par
l'utilisateur du device.

**Electron**
Framework qui permet de créer des applications desktop (Windows, Mac, Linux)
avec du code web (HTML/JS/CSS). C'est ce que VS Code, Slack, Discord
utilisent. Pour Code Rouge : Electron porte le code de « Assaut » sur
Windows en mode plein-écran verrouillé.

**NUC (Intel NUC)**
Petit ordinateur compact (Next Unit of Computing) fabriqué par Intel.
Joue le rôle de « cerveau central » de la session : héberge le serveur,
sert les médias, stocke les logs. Pas d'écran, pas de clavier — juste une
boîte branchée au routeur.

**Données data-driven**
Approche où tout le contenu du jeu (textes, timings, médias, énigmes) vit
dans des fichiers JSON séparés du code. Avantage : Nathanael peut modifier
un texte, ajouter une variante de jeu, changer une vidéo, sans nous
solliciter.

**Zod**
Bibliothèque TypeScript pour valider la forme des données à l'exécution.
Garantit qu'un message reçu par WebSocket a bien la structure attendue avant
qu'on agisse dessus. Premier rempart contre les bugs de format.

**Vitest**
Framework de tests unitaires moderne (alternative à Jest). Rapide, intégré
naturellement à Vite et au TypeScript.

**Turborepo**
Outil qui orchestre les commandes (build, lint, test) à travers les
plusieurs paquets du monorepo, en parallèle quand possible et avec un
cache pour ne pas refaire deux fois le même travail.

**pnpm**
Gestionnaire de paquets Node alternatif à npm. Plus rapide, plus économe en
disque, gère mieux les monorepos.

**better-sqlite3**
Bibliothèque Node pour parler à SQLite. *Better* parce que synchrone (plus
simple à coder pour notre cas) et plus rapide que la concurrence.

**systemd**
Système de gestion des services sous Linux. C'est lui qui démarrera notre
serveur automatiquement au boot du NUC, le redémarrera s'il plante, et
gérera les logs.

---

**Machine à états (state machine)**
La logique qui sait toujours « où en est » une séquence de jeu : quelle étape,
quel choix déjà fait, quel score. Elle ne décide rien « en dur » dans le code,
elle lit la séquence dans un fichier de configuration. C'est le cœur de
« Assaut », testé à 100 %.

**Séquence de préparation**
La phase d'avant-assaut sur « Assaut » : saisie du code d'accès, choix d'une
approche (frontale ou furtive), point d'entrée, attente du code donné par le
Game Master. Les choix faits ici influencent la suite et le score.

**Embranchement scénaristique**
Une bifurcation du scénario : selon un choix du joueur ou une condition, la
séquence saute à une autre étape que celle prévue par défaut. Décrit dans le
fichier de configuration, jamais codé « en dur ».

**% de données récupérées**
Le score de « Assaut », exprimé en pourcentage (0 à 100). Il part d'une valeur
de départ et monte ou descend selon les choix et les embranchements. C'est ce
chiffre que le Game Master voit évoluer pendant la partie.

**Matrice A/B/C/D**
Les quatre parcours différents d'« Attaque de Bots ». Permet à plusieurs
équipes d'alterner sur les modules physiques de la salle sans se gêner. Lue
depuis la configuration, jamais codée en dur.

**Version de jeu**
Standard, courte, longue ou personnalisée. Le Game Master choisit la version
au menu admin ; le moteur data-driven adapte durées et contenus.
