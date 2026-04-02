# Descriptif Fonctionnel - Homelab

## 1. Introduction
**Homelab** est une solution d'orchestration et de centralisation de services auto-hébergés. Conçu pour simplifier l'accès et la gestion d'un écosystème de serveurs personnels (PLEX, Pi-hole, stockages, lecteurs de mangas, etc.), Homelab agit comme une couche d'abstraction (Wrapper + Proxy) offrant une interface unifiée, sécurisée et monitorée.

L'application ne se contente pas d'agréger des liens ; elle encapsule les services pour leur offrir un cadre technique commun (Authentification, Stockage, Monitoring).

TL/DR : **Homelab** permet aux enthousiaste de l'auto-hébergement de centraliser, sécuriser et monitorer leurs services depuis une interface unique et simplifier.
---

## 2. Objectifs et Vision
L'objectif principal est de décharger l'utilisateur des complexités liées à l'exposition de multiples ports et services, tout en apportant des fonctionnalités transverses :
- **Centralisation** : Un seul point d'entrée (endpoint unique) pour l'ensemble des outils du serveur.
- **Sécurité & Sandboxing** : Isolation des services via Docker et gestion centralisée des droits d'accès.
- **Observabilité** : Monitoring en temps réel de l'état des services et des ressources de la machine hôte.
- **Extensibilité** : Facilité d'ajout de nouveaux modules grâce à un SDK standardisé. (Auth & Storage handlers)

---

## 3. Architecture & Services Core

### 3.1 Proxy & Routage (ProxyService)
Le coeur de l'application (Homelab Core) sert de passerelle intelligente :
- **Routage dynamique** : Les requêtes vers `/api/{module}/` sont redirigées vers le module correspondant.
- **Injection de rendu** : Le Core gère l'enveloppe applicative (sidebar, header) tandis que le module s'occupe de son propre contenu métier.

### 3.2 Gestion des Modules (ModulesService)
Service responsable du cycle de vie des modules :
- Enregistrement des services actifs.
- Configuration des routes et des permissions associées à chaque application tierce.

### 3.3 Authentification Centralisée (AuthService)
Homelab propose un système de sécurité partagé :
- **SDK d'Auth** : Les modules utilisent le `homelab-auth-sdk` (TBD) pour déléguer l'authentification au Core.
- **Sécurisation des APIs** : Validation des jetons JWT pour l'ensemble des appels inter-services.
- **Modularité**: Des niveaux de sécurité seront présents a la demande (ex: connexion par clé, par mdp + user ou encore par code d'accés permanent / temporaire)

### 3.4 Couche de Stockage (StorageService)
Abstraction de la manipulation de fichiers sur le serveur :
- **Standardisation** : Utilisation du `homelab-storage-sdk` (TBD) pour garantir une manipulation sécurisée des fichiers.
- **Indépendance** : Le module ne communique pas directement avec le système de fichiers hôte, mais passe par l'interface du Core.
- **Sécurité** : Le module doit excplicitement annoncé les répertoires qu'il souhaite vouloir avoir accés. Le core doit valider ces répertoires et les rendre accessibles au module.

### 3.5 Monitoring & Résilience
- **Télémétrie Système** : Visualisation de l'utilisation CPU/RAM (type `htop`) et de l'espace disque.
- **Health Checks** : Monitoring "Keep Alive" avec mécanisme de **Circuit Breaker** pour isoler les modules tombés ou instables.

---

## 4. Écosystème des Modules
Les modules sont des briques indépendantes venant se greffer sur le Core.

### 4.1 Modules prioritaires (En cours/POC)
- **Photos Storage** : Gestionnaire de photothèque avec préservation des métadonnées originales (EXIF).

### 4.2 Modules planifiés
- **File Storage** : Explorateur de fichiers universel (possible fusion avec le module Photo).
- **Média Center** : Bibliothèque vidéo avec lecteur intégré et liseuse de documents/mangas.
- **DB Explorer** : Interface de requêtage SQL web (inspirée de SnowFlake ou DataGrip).
- **Auto Torrent / ETL** : Flux automatisés de synchronisation de fichiers ou de téléchargements programmables.

---
## 5. A qui s'adresse ce projet ?
Enthousiaste de l'auto-hébergement, Développeur, Sysadmin. 

### 5.1 Acteurs sur l'application
- Utilisateur
- Développeur
- Sysadmin
- Invité

---
## 6. Fonctionnalités
**Auth**
- Se connecter (3 niveaux : clé, mdp + user, code d'accés permanent / temporaire)
- Se déconnecter
**Dashboard**
- Voir les services disponibles
- Voir leur état (up/down)
**Gestion des modules**
- Ajouter un module
- Supprimer un module
- Configurer un module
- Run / Stop / Restart un module
- Voir les logs d'un module
**Monitoring**
- Voir CPU / RAM
- Voir l'espace disque
- Voir l'état des services

---
## 7. Spécifications Techniques
- **Backend** : Kotlin / Spring Boot (Gestion du multithreading et de la résilience).
- **Frontend** : React / TypeScript / Vite (Interface moderne et réactive).
- **Mobile** : React Native / TypeScript // Flutter (Application mobile pour l'accès nomade, en attente de maturité).
- **Conteneurisation** : Docker & Docker Compose (Isolation et portabilité) / greffage possible de service en run déja existant (ex: Pi-hole, Plex, etc || maturité sur le sujet nécessaire).
- **Communication** : API REST sécurisée.

---
## 8. Use Case
### 8.1 Ajouter un module
- L'admin ajoute le dossier du module dans {project.root}/module
- Il configure le fichier homelab-module.json pour etre découvert par le core
- Le core scanne le dossier module et ajoute les modules trouvés
- Le module est maintenant disponible dans le dashboard
- L'admin peut maintenant lancé le module
### 8.1 Stopper un module
- L'admin clique sur le bouton stop du module
- Le module est arrêté
### 8.2 Accéder à un module
- L'utilisateur clique sur le module dans le dashboard
- Il est redirigé vers l'interface du module
### 8.3 Donner l'accés à l'application
- L'admin vas dans les options
- En fonction du niveau de sécurité activé, l'utilisateur devra soit donner son mail soit donner sa clé publique. 
- L'admin ajoute l'utilisateur par le biais de connexion décidé.
- Si mail, l'utilisateur reçoit un mail avec un lien de connexion ou un code d'accés temporaire.
- Si clé publique, l'admin devra confirmer a l'utilisateur qu'il a bien ajouté sa clé publique.
- L'utilisateur peut maintenant se connecter

## 9. Parcours utilisateur
- "Un utilisateur se connecte -> arrive sur un dashboard -> voit {Module} -> clique -> accède via proxy"
- "Un admin se connecte ->arrive sur un dashboard -> voit {Module} non lancé -> clique pour le lancer -> le module est lancé -> clique -> accède via proxy"

## 10. Régle métier
- Seul un admin peut ajouter un module
- Un module doit déclarer ses accés
- Un module sans healthcheck actif est désactivé
- Un module doit déclarer ses informations
- Un Utilisateur doit pouvoir accéder aux modules
- Un utilisateur n'a pas besoin de voir les informations d'état du core
- Un Admin doit pouvoir décider du systeme de connexion quand il le souhaite
- Un admin doit pouvoir ajouter des connexions pour les utilisateurs 
- Le core doit pouvoir donner les logs des modules dans le front
- Le core doit pouvoir donner accés au terminal des différents modules si l'admin veut faire une action dessus
- L'admin doit pouvoir faire une action des les terminaux des modules


## Compléxité 

L'application ce veut simple d'utilisation mais cache une complexité technique importante. En effet, le but est de pouvoir ajouter des modules sans toucher au code du core. Pour cela, il faut que le core soit capable de gérer les modules de manière dynamique. De plus le développement d'une application mobile pour l'accompagner est complexe. Un certains équilibre entre liberté de code et intégration est nécessaire et une maturité de conception et demande est nécessaire. 

Pour l'instant le projet est en phase de POC et nous testons différentes approches pour trouver la meilleure solution. Le mobile est lui mit de côté le temps d'avoir une plus grande maturité sur son utilité dans le projet. 