# 🚀 Guide de Déploiement Champollion sur Fly.io

## Prérequis

- Compte GitHub avec le repo Champollion
- [Compte Fly.io](https://fly.io) (gratuit)
- Terminal avec git installé

---

## Étape 1 : Installer le CLI Fly.io

```bash
# Linux/macOS
curl -L https://fly.io/install.sh | sh

# Ajouter au PATH (ajoutez cette ligne à ~/.bashrc ou ~/.zshrc)
export FLYCTL_INSTALL="/home/$USER/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Vérifier l'installation
fly version
```

---

## Étape 2 : Se connecter à Fly.io

```bash
fly auth login
```
> Cela ouvre un navigateur pour vous authentifier.

---

## Étape 3 : Déployer la Base de Données PostgreSQL

```bash
# Créer la base de données (région Paris)
fly postgres create --name champollion-db --region cdg

# Choisissez : Development (gratuit, 256MB RAM, 1GB stockage)
```

> ⚠️ **IMPORTANT** : Notez les identifiants affichés (username, password, connection string) !

---

## Étape 4 : Déployer le Backend

### 4.1 Initialiser l'application

```bash
cd /home/orso/Repositories/Champollion/backend

# Lancer l'initialisation (répondez "y" pour utiliser le fly.toml existant)
fly launch --no-deploy
```

### 4.2 Créer le volume de stockage audio

```bash
fly volumes create audio_data --region cdg --size 1
```

### 4.3 Attacher la base de données

```bash
fly postgres attach champollion-db --app champollion-backend
```
> Cela définit automatiquement `DATABASE_URL`.

### 4.4 Configurer les secrets

**Générez vos propres clés** (ne réutilisez jamais des clés publiées) :

```bash
# Générer la clé Fernet (dans le venv backend)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Générer la clé JWT
openssl rand -hex 32
```

**Puis configurez-les sur Fly.io :**

```bash
# Remplacez par VOS clés générées ci-dessus
fly secrets set FERNET_SECRET_KEY="votre-clé-fernet-générée"
fly secrets set JWT_SECRET="votre-clé-jwt-générée"

# CORS - autoriser le frontend (à mettre à jour après déploiement frontend)
fly secrets set CORS_ALLOWED_ORIGINS='["https://champollion-frontend.fly.dev"]'
```

### 4.5 Déployer

```bash
fly deploy
```

### 4.6 Vérifier

```bash
# Voir les logs
fly logs

# Ouvrir l'app dans le navigateur
fly open
```

---

## Étape 5 : Déployer le Frontend

### 5.1 Mettre à jour l'URL du backend

Éditez `frontend/fly.toml` et remplacez l'URL du backend si nécessaire :

```toml
[build.args]
  VITE_API_BASE_URL = "https://champollion-backend.fly.dev"
```

### 5.2 Initialiser et déployer

```bash
cd /home/orso/Repositories/Champollion/frontend

# Initialiser (utilisez le fly.toml existant)
fly launch --no-deploy

# Déployer
fly deploy
```

### 5.3 Mettre à jour le CORS du backend

Une fois le frontend déployé, mettez à jour les origines CORS du backend :

```bash
cd ../backend
fly secrets set CORS_ALLOWED_ORIGINS='["https://champollion-frontend.fly.dev"]'
```

---

## 🎉 Terminé !

Vos applications sont maintenant accessibles :

| Service | URL |
|---------|-----|
| **Frontend** | https://champollion-frontend.fly.dev |
| **Backend API** | https://champollion-backend.fly.dev |

---

## Commandes Utiles

```bash
# Voir le statut
fly status

# Voir les logs en temps réel
fly logs -f

# Accéder au shell de l'app
fly ssh console

# Redémarrer l'app
fly apps restart

# Voir les secrets configurés
fly secrets list

# Mettre à jour un secret
fly secrets set NOM_SECRET="nouvelle-valeur"
```

---

## Dépannage

### L'app ne démarre pas
```bash
fly logs  # Vérifier les erreurs
fly status  # Vérifier l'état des machines
```

### Erreurs de base de données
```bash
fly postgres connect -a champollion-db
# Puis exécutez des requêtes SQL pour diagnostiquer
```

### Reconstruire et redéployer
```bash
fly deploy --force
```

---

## Coûts Estimés (Tier Gratuit)

| Ressource | Inclus Gratuit | Votre Usage |
|-----------|----------------|-------------|
| VMs partagées | 3 VMs | 2 (backend + frontend) |
| PostgreSQL Dev | 1 instance | 1 |
| Stockage | 3 GB | 1 GB (volume audio) |
| Bande passante | 100 GB/mois | Variable |

> 💡 Avec `min_machines_running = 1`, vos apps restent toujours actives = **pas de cold start**.
