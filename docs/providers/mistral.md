# Provider Documentation — Mistral (Voxtral STT & LLM)

**Version:** 2.1
**Dernière mise à jour:** Novembre 2025

**Sources:**
- [Mistral API docs](https://docs.mistral.ai/)
- [Audio capabilities](https://docs.mistral.ai/capabilities/audio/)
- [Voxtral announcement](https://mistral.ai/news/voxtral)

> Voir aussi: [ARCHITECTURE.md](../ARCHITECTURE.md) pour l'architecture complète.

## Vue d'Ensemble

**Modèles Utilisés:**
- **STT:** `voxtral-mini-latest` (speech-to-text)
- **LLM:** `mistral-medium-latest` (génération de notes structurées)

**Authentification:**
- API Key stockée chiffrée (Fernet) dans `User.api_key_encrypted`
- Utilisée pour instancier le client Mistral ou effectuer les requêtes HTTP

**Base URL:** `https://api.mistral.ai`

## Capacités et Limites

### STT (Voxtral)
- **Context length:** 32k tokens (théorique)
- **Audio duration (documentée):** jusqu'à 30 minutes par segment
- **Audio duration (observée):** ~4-5 minutes avant troncature API
- **Formats supportés:** MP3, WAV, M4A, WebM
- **Implémentation actuelle:** Segmentation automatique à 8min par sécurité via FFmpeg
- **Note:** L'API Mistral présente une limite non documentée causant une troncature précoce. La segmentation automatique contourne ce problème.

## Speech-to-Text API

### Prétraitement Audio

**Conversion automatique:**
- Tous les segments sont convertis en WAV mono 16kHz avant envoi
- Évite les rejets 422 liés aux types MIME
- Utilise FFmpeg pour la conversion

**Segmentation:**
- Audios >8min découpés automatiquement (réduit de 30min suite à découverte de limites API)
- Segments de 8min maximum pour éviter troncature observée à ~4-5min
- Transcriptions concaténées automatiquement

### Implémentation (`MistralAudioProcessor`)

Le processeur utilise l'API REST directement via `httpx` pour une compatibilité maximale avec les fichiers audio segmentés.

**Endpoint:** `POST https://api.mistral.ai/v1/audio/transcriptions`

**Payload (Multipart):**
- `file`: Fichier audio (WAV)
- `model`: `voxtral-mini-latest`
- `language`: (Optionnel) Code ISO
- `timestamp_granularities`: `segment`

**Gestion des erreurs:**
- Conversion WAV locale pour éviter les incompatibilités de format
- Retry automatique sur erreurs réseau
- Nettoyage automatique des fichiers temporaires

## LLM API (Génération de Documents)

### Configuration
- **Client:** SDK officiel `mistralai`
- **Modèle:** `mistral-medium-latest`
- **Temperature:** 0.4 (équilibre créativité/cohérence)

### Structure du Prompt

**System message:**
```
Tu es un assistant pédagogique. Génère UNIQUEMENT un cours en Markdown structuré.
Ne fournis AUCUN commentaire, introduction ou conclusion avant ou après le Markdown.
Le document doit commencer directement par le titre (# Titre) et finir par le contenu.
Structure requise: # Titre, ## Résumé, ## Concepts clés, ## Déroulé du cours, ## Points à retenir.
```

**Sortie attendue:**
Markdown pur, nettoyé des balises de code (```markdown) par le générateur.

### Gestion des Tokens
- **Limite contexte:** 32k tokens (Mistral Small/Medium/Large)
- **Estimation:** Fonction d'estimation basique (ratio caractères/tokens) disponible dans l'API.

## Implémentation Backend

### Audio Processor

**Fichier:** `backend/app/processors/audio.py`

**Classe:** `MistralAudioProcessor` (hérite de `SourceProcessor`)

**Responsabilités:**
1. Validation du fichier audio
2. Segmentation intelligente (FFmpeg) si > 8 min
3. Conversion en WAV temporaire
4. Appel API Mistral STT pour chaque segment
5. Concaténation des transcriptions
6. Nettoyage des fichiers temporaires

### Document Generator

**Fichier:** `backend/app/generators/mistral.py`

**Classe:** `MistralGenerator` (hérite de `GenerationStrategy`)

**Responsabilités:**
1. Agrégation des textes sources
2. Construction du prompt système/utilisateur
3. Appel API Mistral LLM via SDK
4. Nettoyage du Markdown retourné (suppression des fences)
5. Gestion des métadonnées

## Extensibilité Multi-Provider

**Architecture actuelle:**
- **Processors:** Protocol `SourceProcessor` pour l'ingestion (Audio, PDF, etc.)
- **Generators:** Protocol `GenerationStrategy` pour la création de documents (Mistral, OpenAI, etc.)
- Enregistrement via `ProcessorRegistry` et `GeneratorRegistry`.

## Fichiers Temporaires

**Répertoire:** `backend/tmp/mistral/`

**Contenu:**
- Segments audio (FFmpeg)
- Fichiers WAV convertis

**Nettoyage:**
- Automatique après traitement via context managers
- Startup cleanup (fichiers >24h) implémenté dans `backend/app/utils/cleanup.py`

## Références

**Code:**
- `backend/app/processors/audio.py` - Processeur Audio Mistral
- `backend/app/generators/mistral.py` - Générateur de documents Mistral
- `backend/app/processors/base.py` - Protocol SourceProcessor
- `backend/app/generators/base.py` - Protocol GenerationStrategy
- `backend/app/utils/audio.py` - Utilitaires audio
- `backend/app/utils/cleanup.py` - Nettoyage fichiers temp

**Documentation:**
- [Mistral API Docs](https://docs.mistral.ai/)
- [Audio Capabilities](https://docs.mistral.ai/capabilities/audio/)

---

**Voir aussi:**
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Architecture complète
- [API.md](../API.md) - Endpoints API
- [DEVELOPMENT.md](../DEVELOPMENT.md) - Guide développement
