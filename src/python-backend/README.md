# Sentinel IDS - Service de Capture Python

Ce service capture les paquets réseau en temps réel, les analyse avec votre modèle RandomForest, et diffuse les résultats vers le dashboard web via WebSocket.

## Architecture

```
[Interface Réseau] → [Scapy Capture] → [RandomForest Model] → [WebSocket] → [React Dashboard]
```

## Installation Rapide

### 1. Prérequis

- Python 3.8+
- Privilèges administrateur (pour la capture de paquets)
- Votre modèle RandomForest entraîné (optionnel pour la démo)

### 2. Installation

```bash
# Cloner et aller dans le répertoire
cd python-backend/

# Installer les dépendances
pip install -r requirements.txt

# Démarrer le service (avec privilèges admin)
sudo python3 start_sentinel.py
```

## Configuration

### Variables d'environnement

Copiez `.env.example` vers `.env` et modifiez selon vos besoins :

```bash
cp .env.example .env
```

Variables principales :
- `SENTINEL_HOST` : Adresse d'écoute WebSocket (localhost)
- `SENTINEL_PORT` : Port WebSocket (8765)
- `SENTINEL_MODEL_PATH` : Chemin vers votre modèle RandomForest
- `SENTINEL_INTERFACE` : Interface réseau (auto-détection si vide)
- `SENTINEL_FILTER` : Filtre BPF pour la capture

### Votre modèle RandomForest

Placez votre modèle dans le dossier `models/` :

```bash
models/
└── random_forest_model.pkl  # Votre modèle entraîné
```

Formats supportés :
- Pickle (`.pkl`)
- Joblib (`.joblib`)
- Scikit-learn native

## Utilisation

### Démarrage Simple

```bash
sudo python3 start_sentinel.py
```

### Démarrage Manuel

```bash
# Avec configuration personnalisée
SENTINEL_INTERFACE=eth0 SENTINEL_PORT=9999 sudo python3 sentinel_capture.py
```

### Interface Web

1. Démarrez le service Python
2. Ouvrez le dashboard React sur `http://localhost:3000`
3. Naviguez vers "Trafic en Direct"
4. Connectez-vous au service via l'interface de connexion
5. Démarrez la capture et observez les résultats

## Caractéristiques du Modèle

Le service extrait automatiquement les 41 caractéristiques du dataset KDD Cup 99 :

### Caractéristiques de base
- `duration`, `src_bytes`, `dst_bytes`
- `land`, `wrong_fragment`, `urgent`

### Caractéristiques de contenu
- `hot`, `num_failed_logins`, `logged_in`
- `num_compromised`, `root_shell`, `su_attempted`
- `num_root`, `num_file_creations`, `num_shells`

### Caractéristiques de trafic
- `count`, `srv_count`, `serror_rate`
- `srv_serror_rate`, `rerror_rate`, `srv_rerror_rate`
- `same_srv_rate`, `diff_srv_rate`, `srv_diff_host_rate`

### Caractéristiques d'hôte
- `dst_host_count`, `dst_host_srv_count`
- `dst_host_same_srv_rate`, `dst_host_diff_srv_rate`
- `dst_host_same_src_port_rate`, `dst_host_srv_diff_host_rate`
- `dst_host_serror_rate`, `dst_host_srv_serror_rate`
- `dst_host_rerror_rate`, `dst_host_srv_rerror_rate`

## Protocoles WebSocket

### Messages entrants (Frontend → Python)

```json
{
  "type": "start_capture",
  "interface": "eth0",
  "filter": "net 192.168.0.0/16"
}
```

```json
{
  "type": "stop_capture"
}
```

### Messages sortants (Python → Frontend)

#### Paquet capturé
```json
{
  "type": "packet",
  "data": {
    "id": "pkt_1234567890_123",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "sourceIp": "192.168.1.100",
    "destinationIp": "192.168.1.1",
    "sourcePort": 54321,
    "destinationPort": 80,
    "protocol": "TCP",
    "size": 1460,
    "flags": ["SYN", "ACK"],
    "payloadPreview": "GET /api/data HTTP/1.1",
    "prediction": "Normal",
    "anomaly_score": 0.15,
    "threat_level": "Informationnel",
    "features": { ... }
  }
}
```

#### Statistiques
```json
{
  "type": "stats",
  "data": {
    "total_packets": 1234,
    "packets_per_second": 15,
    "anomalies_detected": 12,
    "is_capturing": true,
    "connected_clients": 1,
    "queue_size": 45
  }
}
```

## Sécurité

### Privilèges requis

La capture de paquets nécessite des privilèges administrateur :

```bash
# Linux/Mac
sudo python3 sentinel_capture.py

# Ou configurer les capacités (Linux)
sudo setcap cap_net_raw+ep /usr/bin/python3
```

### Filtrage réseau

Utilisez des filtres BPF pour limiter la capture :

```bash
# Réseaux privés seulement
SENTINEL_FILTER="net 192.168.0.0/16 or net 10.0.0.0/8" python3 sentinel_capture.py

# Port HTTP/HTTPS seulement
SENTINEL_FILTER="port 80 or port 443" python3 sentinel_capture.py
```

## Déploiement

### Docker

```dockerfile
FROM python:3.9

# Installation des dépendances système
RUN apt-get update && apt-get install -y libpcap-dev

# Installation des dépendances Python
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copie du code
COPY . /app
WORKDIR /app

# Démarrage
CMD ["python3", "sentinel_capture.py"]
```

```bash
# Construction et démarrage
docker build -t sentinel-ids .
docker run --net=host --privileged sentinel-ids
```

### Systemd (Linux)

```ini
[Unit]
Description=Sentinel IDS Packet Capture Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/sentinel-ids
ExecStart=/usr/bin/python3 /opt/sentinel-ids/sentinel_capture.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Performance

### Optimisations

1. **Filtrage BPF** : Réduisez la charge avec des filtres spécifiques
2. **Interface spécifique** : Capturez uniquement l'interface nécessaire
3. **Batch processing** : Le modèle traite les paquets individuellement mais peut être optimisé pour les lots
4. **Queue management** : Ajustez `SENTINEL_MAX_PACKET_QUEUE` selon votre mémoire

### Monitoring

```bash
# Logs en temps réel
tail -f sentinel_capture.log

# Statistiques système
htop
iotop
```

## Dépannage

### Erreurs communes

1. **Permission denied** : Exécutez avec `sudo`
2. **Module not found** : Installez les dépendances avec `pip install -r requirements.txt`
3. **No interface found** : Vérifiez les privilèges et les interfaces réseau
4. **WebSocket connection failed** : Vérifiez que le port 8765 est disponible

### Debug

```bash
# Mode debug
SENTINEL_LOG_LEVEL=DEBUG python3 sentinel_capture.py

# Test de connectivité
nc -v localhost 8765
```

## Développement

### Structure du projet

```
python-backend/
├── sentinel_capture.py      # Service principal
├── start_sentinel.py        # Script de démarrage
├── requirements.txt         # Dépendances Python
├── .env.example            # Configuration exemple
├── models/                 # Modèles ML
└── logs/                   # Fichiers de log
```

### Extension du modèle

Pour utiliser un autre modèle ou ajouter des caractéristiques :

1. Modifiez `NetworkFeatureExtractor.extract_features()`
2. Adaptez `SentinelPacketCapture._predict_anomaly()`
3. Mettez à jour les types TypeScript dans le frontend

### Tests

```bash
# Test du service de base
python3 -m pytest tests/

# Test de charge
python3 test_performance.py
```

## Support

Pour toute question ou problème :
1. Consultez les logs : `sentinel_capture.log`
2. Vérifiez la configuration : `.env`
3. Testez la connectivité réseau
4. Validez les privilèges administrateur

---

**⚠️ Important** : Ce service capture et analyse le trafic réseau. Assurez-vous de respecter les lois locales sur la confidentialité et la surveillance réseau.