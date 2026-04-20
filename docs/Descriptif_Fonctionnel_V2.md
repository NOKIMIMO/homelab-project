# Descriptif Fonctionnel - HomeStock (V2)

## 1. Introduction
**HomeStock** est une application auto-hebergee de **stockage, distribution et affichage de fichiers**.

Elle permet de centraliser des contenus heterogenes (photos, videos, documents et autres fichiers), puis de les rendre accessibles via des interfaces adaptees a chaque usage : consultation rapide, streaming, lecture document, navigation de bibliotheque.

Le produit est pense pour delivrer une experience fluide sur mobile et web, tout en gardant la maitrise des donnees sur une infrastructure personnelle.

---

## 2. Objectifs et Vision
HomeStock poursuit 4 objectifs principaux :
- **Stocker durablement** les fichiers avec conservation des originaux.
- **Distribuer intelligemment** les contenus selon le contexte d'affichage (taille, qualite, debit).
- **Afficher efficacement** les medias avec des vues specialisees.
- **Simplifier l'acces mobile** pour consulter et partager les contenus depuis n'importe ou.

Objectif complementaire :
- **Automatiser l'ingestion** de fichiers via des flux de collecte (si priorise).

---

## 3. Perimetre Fonctionnel
HomeStock couvre une chaine complete de traitement de fichier :
- **Ingestion** : reception des fichiers (upload manuel et, a terme, collecte automatisee).
- **Stockage** : conservation de la source + indexation metadonnees.
- **Optimisation** : compression, generation de variantes, preparation au streaming.
- **Distribution** : livraison adaptee au terminal et au reseau.
- **Affichage** : consultation par type de contenu.

---

## 4. Services Fonctionnels

### 4.1 Authentification et Acces
- Connexion / deconnexion utilisateur.
- Gestion des roles minimum : Admin, Utilisateur.
- Controle des permissions d'acces aux bibliotheques et collections.

### 4.2 Stockage et Indexation
- Upload de fichiers de tout type.
- Organisation en dossiers, albums, collections ou tags.
- Conservation du fichier original.
- Indexation des metadonnees techniques : type MIME, taille, checksum, date, dimensions, duree, EXIF si disponible.

### 4.3 Optimisation et Distribution
- Compression automatique pour les formats compatibles.
- Generation de versions legeres (miniatures, previews, qualites intermediaires).
- Streaming des medias volumineux.
- Lecture partielle et distribution par segments pour limiter les transferts lourds.

### 4.4 Affichage et Consultation
- Galerie photo.
- Lecteur video.
- Reader de documents (priorites configurees par le produit : PDF, ePub, CBZ, etc.).
- Explorateur generique pour les autres formats.

### 4.5 Administration et Monitoring
- Visualisation de la capacite de stockage et de son evolution.
- Indicateurs de disponibilite du service.
- Metriques de base sur les flux de lecture et de distribution.

---

## 5. Plateformes Cibles
- **Mobile (priorite)** : Flutter.
- **Web** : interface de consultation et d'administration.

Le mobile est considere comme un point d'acces principal pour la consommation des contenus.

---

## 6. Fonctionnalites

### 6.1 MVP
- Authentification utilisateur.
- Upload et indexation des fichiers.
- Navigation dans la bibliotheque.
- Consultation photo, video et document de base.
- Recuperation de versions adaptees a l'affichage.

### 6.2 Evolutions
- Compression/transcodage avance.
- Streaming adaptatif.
- Optimisation de lecture partielle sur gros fichiers.
- Ingestion automatisee depuis des flux externes.

---

## 7. Specifications Techniques
- **Backend** : Kotlin / Spring Boot (API REST, traitement fichiers, traitements asynchrones).
- **Client mobile** : Flutter.
- **Client web** : interface de gestion et de consultation.
- **Stockage** : systeme de fichiers avec index metadonnees.
- **Execution** : Docker / Docker Compose.

---

## 8. Use Cases

### 8.1 Uploader et cataloguer un fichier
1. L'utilisateur envoie un fichier depuis mobile ou web.
2. Le systeme valide les contraintes (type, taille, permissions).
3. Le fichier est stocke et ses metadonnees sont extraites.
4. Le contenu apparait dans la bibliotheque.

### 8.2 Consulter une photo
1. L'utilisateur ouvre une photo depuis sa galerie.
2. Le client demande une version adaptee a l'ecran.
3. Le service retourne une version optimisee.
4. L'affichage est rapide, l'original reste disponible.

### 8.3 Lire une video
1. L'utilisateur lance une video.
2. Le service demarre la distribution en streaming.
3. La lecture commence sans telechargement complet du media.

### 8.4 Ouvrir un document volumineux
1. L'utilisateur ouvre un document important.
2. Le service charge les portions utiles a la lecture.
3. Le reader reste fluide sans charge memoire excessive.

### 8.5 Administrer le stockage
1. L'admin consulte l'espace utilise et les indicateurs de service.
2. Il ajuste les regles de compression/distribution.
3. Le systeme applique les nouvelles regles aux nouveaux contenus.

---

## 9. Parcours Utilisateur
- "Un utilisateur se connecte -> parcourt sa bibliotheque -> ouvre un media -> le consulte dans un format adapte."
- "Un admin se connecte -> gere les contenus et les regles de stockage -> suit la capacite et la disponibilite du service."

---

## 10. Regles Metier
- Le fichier original est conserve, sauf politique explicite de retention.
- Chaque version optimisee doit etre rattachee a sa source.
- Les droits d'acces s'appliquent a toute operation de lecture, telechargement et partage.
- Les traitements d'optimisation sont asynchrones pour ne pas bloquer l'usage.
- La distribution doit minimiser la bande passante sans degrader la lisibilite.

---

## 11. Complexite Technique
Les enjeux techniques principaux du projet sont :
- Performance de traitement des gros volumes de fichiers.
- Equilibre qualite/poids pour les variantes diffusees.
- Streaming et lecture partielle sur reseaux variables.
- Coherence d'experience entre mobile et web.

HomeStock vise une architecture robuste et pragmatique, centree sur la valeur utilisateur : **stocker, retrouver et consulter efficacement les fichiers**.