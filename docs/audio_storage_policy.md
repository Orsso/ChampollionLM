# Champollion — Local Audio Storage Policy

**Version:** 2.1  
**Dernière mise à jour:** Novembre 2025

> Voir aussi: [ARCHITECTURE.md](ARCHITECTURE.md#stockage) pour l'architecture complète du stockage.

## Objectives
1. Décrire précisément où et comment les fichiers audio sont stockés en local.
2. Définir les conventions de nommage, tailles maximales et durée retenue (max 2h).
3. Prévoir les points d’entrée pour un nettoyage manuel, sans automatisation (KISS/YAGNI).

## Storage Root
- Racine configurable via variable d'environnement `AUDIO_STORAGE_ROOT`, défaut `./storage/audio`.
- Arborescence hiérarchique : `/<root>/<user_id>/<project_id>/`.
- Exemple : `storage/audio/42/105/` contient toutes les ressources audio du projet 105 de l'utilisateur 42.

## File Naming Convention
- Enregistrement live : `recording-<timestamp>.webm`
  - `timestamp` format `YYYYmmdd-HHMMSS` (UTC) pour unicité.
  - Exemple : `recording-20250929-143000.webm`.
- Upload fichier existant : `upload-<timestamp>-<original_name>`
  - `original_name` nettoyé (ASCII, espaces → `_`).
  - Exemple : `upload-20250929-101500-etienne_klein.mp3`.
- Conversion éventuelle:
  - Upload: on accepte `.webm`, `.wav`, `.mp3`, `.m4a` directement.
  - Transcription: le backend convertit les segments en **WAV (mono 16 kHz)** avant envoi au provider STT (fiabilité MIME/codec). Les fichiers temporaires sont nettoyés automatiquement.

## Metadata Tracking
- Métadonnées stockées dans la table `Source` (type `audio`) :
  - `file_path` (chemin relatif ou absolu)
  - `source_metadata` (JSON contenant `duration_seconds`, `size_bytes`, `filename`)
  - `created_at`
- Backend met à jour les métadonnées suite à l'upload.

## Size & Duration Limits
- Taille maximale par fichier : `MAX_AUDIO_BYTES` configurable (défaut 500 MB) → largement > 2h WAV mono 16 kHz.
- Durée : contrôlée côté frontend (alerte > 2h) et backend (validation `duration_seconds <= 7200`). Si la durée n’est pas lisible (Mutagen), l’upload est accepté avec `duration_seconds = 0`.
- Si limite dépassée : retourner `413 Payload Too Large` lors de l’upload.

## Permissions & Security
- Répertoire créé avec permissions restreintes (`700` sur Unix) pour empêcher l’accès par d’autres utilisateurs du système.
- Aucune exposition via HTTP direct ; téléchargements uniquement via endpoints authentifiés (si feature future). Pour MVP, fichiers non exposés.

## Cleanup Strategy
- Pas de purge automatique (usage personnel).
- Suppression d'un projet → suppression cascade côté DB et suppression du dossier `/<root>/<user>/<project>/` par le backend.
- Suppression d'une source → suppression du fichier audio correspondant.
- Au démarrage : nettoyage automatique des fichiers temporaires (>24h) dans `tmp/mistral/`.

## Error Handling
- Upload : si échec écriture disque → renvoyer `500` avec message "Impossible d'écrire le fichier audio, vérifier l'espace disponible".
- Backend crée le dossier `/<root>/<user>/<project>/` avant stockage (`pathlib.Path.mkdir(parents=True, exist_ok=True)`).

## Summary
- Stockage purement local, structuré par utilisateur et projet.
- Nommage par timestamp pour éviter collision.
- Quotas simples (durée, taille) et nettoyage automatique des fichiers temporaires.
- Conforme aux contraintes : usage personnel, pas de service externe, principes KISS/DRY/YAGNI respectés.

---

**Voir aussi:**
- [ARCHITECTURE.md](ARCHITECTURE.md#stockage) - Architecture stockage complète
- [environment_requirements.md](environment_requirements.md) - Configuration variables d'environnement

