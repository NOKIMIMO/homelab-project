# Homelab

Homelab est une application permettant de réunir en un seul endpoint plusieurs solutions/applications habituellement réservées à des serveurs maisons (tels qu'un PLEX, un stockage, un pihole, un manga reader, accès à BDD, etc.). L'application se met par-dessus et sert de wrapper + proxy aux différents services.

## Son but

- Télémétrie et information d'utilisation externe
- Télémétrie et information d'utilisation locale (htop des process et taille de stockage)
- Monitoring des différents services avec circuit breaker + keep alive (?)
- Sandboxing et sécurisation des différentes apps (dockering + visualisation des accès et activités des modules)
- Préconfiguration de déploiement d'applications (l'utilisateur peut toujours drop des jar dans les modules mais la configuration et leur développement est 100% à la responsabilité de l'utilisateur). Nous créerons nous-mêmes des configurations préfaites pour installer certaines applications mises en dur dans le code (à revoir)
- Proxy des différentes interfaces web des applications + API (le core de l'application permettra de choisir le module à regarder et son rendu sera géré par l'application, non pas par le core)
- SDK permettant de laisser le core gérer l'authentification utilisateur
- SDK permettant de laisser le core gérer la manipulation de fichiers sur la machine

## Modules prévus créés par nous

- Photos Storage (POC step)
- File Storage (possiblement merge dans photos)
- Bibliothèque lecture + reader
- Bibliothèque vidéo + player
- DB Explorer + requêteur (type SnowFlake / DataGrip web)
- Auto Torrent (?) (potentiellement juste un auto ETL avec différents flux programmables, à voir techniquement faisable ou non)