# Guide d'Intégration Python - Capture de Paquets Réelle

## Vue d'ensemble

Ce guide explique comment intégrer votre modèle RandomForestClassifier Python existant avec l'application Sentinel IDS pour la capture de paquets réseau en temps réel.

## Architecture Recommandée

```
[Interface Réseau] → [Python Packet Capture] → [WebSocket Server] → [React Frontend]
```

## 1. Service de Capture Python

### Dépendances requises

```bash
pip install scapy pandas numpy scikit-learn websockets asyncio
```

### Script de Capture Principal

```python
# packet_capture_service.py
import asyncio
import json
import time
import numpy as np
import pandas as pd
from scapy.all import sniff, IP, TCP, UDP, ICMP
from sklearn.externals import joblib  # ou pickle
import websockets
from datetime import datetime
import threading
from queue import Queue

class SentinelPacketCapture:
    def __init__(self, model_path, websocket_port=8765):
        self.model = joblib.load(model_path)  # Votre modèle RandomForest
        self.websocket_port = websocket_port
        self.packet_queue = Queue()
        self.is_capturing = False
        self.connected_clients = set()
        
    def extract_features(self, packet):
        """
        Extrait les caractéristiques du paquet pour le modèle RandomForest
        À adapter selon vos caractéristiques spécifiques
        """
        features = {
            'duration': 0,  # À calculer selon votre logique
            'src_bytes': len(packet) if packet else 0,
            'dst_bytes': 0,  # À calculer
            'land': 1 if (hasattr(packet, 'src') and hasattr(packet, 'dst') and packet.src == packet.dst) else 0,
            'wrong_fragment': 0,
            'urgent': 0,
            'hot': 0,
            'num_failed_logins': 0,
            'logged_in': 0,
            'num_compromised': 0,
            'root_shell': 0,
            'su_attempted': 0,
            'num_root': 0,
            'num_file_creations': 0,
            'num_shells': 0,
            'num_access_files': 0,
            'num_outbound_cmds': 0,
            'is_host_login': 0,
            'is_guest_login': 0,
            'count': 1,
            'srv_count': 1,
            'serror_rate': 0,
            'srv_serror_rate': 0,
            'rerror_rate': 0,
            'srv_rerror_rate': 0,
            'same_srv_rate': 1,
            'diff_srv_rate': 0,
            'srv_diff_host_rate': 0,
            'dst_host_count': 1,
            'dst_host_srv_count': 1,
            'dst_host_same_srv_rate': 1,
            'dst_host_diff_srv_rate': 0,
            'dst_host_same_src_port_rate': 1,
            'dst_host_srv_diff_host_rate': 0,
            'dst_host_serror_rate': 0,
            'dst_host_srv_serror_rate': 0,
            'dst_host_rerror_rate': 0,
            'dst_host_srv_rerror_rate': 0,
        }
        
        # Ajoutez votre logique d'extraction de caractéristiques ici
        return features
    
    def packet_handler(self, packet):
        """Gestionnaire de paquet appelé par Scapy"""
        if not self.is_capturing:
            return
            
        try:
            # Extraction des informations de base
            packet_info = {
                'id': f"pkt_{int(time.time() * 1000)}_{id(packet)}",
                'timestamp': datetime.now().isoformat(),
                'size': len(packet)
            }
            
            # Informations IP
            if IP in packet:
                packet_info.update({
                    'sourceIp': packet[IP].src,
                    'destinationIp': packet[IP].dst,
                    'protocol': packet[IP].proto
                })
            
            # Informations de port
            if TCP in packet:
                packet_info.update({
                    'sourcePort': packet[TCP].sport,
                    'destinationPort': packet[TCP].dport,
                    'protocol': 'TCP',
                    'flags': self.get_tcp_flags(packet[TCP])
                })
            elif UDP in packet:
                packet_info.update({
                    'sourcePort': packet[UDP].sport,
                    'destinationPort': packet[UDP].dport,
                    'protocol': 'UDP',
                    'flags': []
                })
            elif ICMP in packet:
                packet_info.update({
                    'sourcePort': 0,
                    'destinationPort': 0,
                    'protocol': 'ICMP',
                    'flags': []
                })
            
            # Extraction des caractéristiques pour le modèle
            features = self.extract_features(packet)
            packet_info['features'] = features
            
            # Prédiction avec le modèle RandomForest
            feature_vector = [list(features.values())]
            prediction_proba = self.model.predict_proba(feature_vector)[0]
            prediction = self.model.predict(feature_vector)[0]
            
            # Score d'anomalie (probabilité de la classe anomalie)
            anomaly_score = max(prediction_proba)  # Ajustez selon vos classes
            
            packet_info.update({
                'prediction': 'Anomalie' if prediction == 1 else 'Normal',  # Ajustez selon vos labels
                'anomaly_score': float(anomaly_score),
                'threat_level': self.get_threat_level(anomaly_score),
                'payloadPreview': str(packet.payload)[:50] if packet.payload else ''
            })
            
            # Ajouter à la queue pour envoi WebSocket
            self.packet_queue.put(packet_info)
            
        except Exception as e:
            print(f"Erreur lors du traitement du paquet: {e}")
    
    def get_tcp_flags(self, tcp_packet):
        """Extrait les flags TCP"""
        flags = []
        if tcp_packet.flags.S: flags.append('SYN')
        if tcp_packet.flags.A: flags.append('ACK')
        if tcp_packet.flags.F: flags.append('FIN')
        if tcp_packet.flags.R: flags.append('RST')
        if tcp_packet.flags.P: flags.append('PSH')
        if tcp_packet.flags.U: flags.append('URG')
        return flags
    
    def get_threat_level(self, score):
        """Détermine le niveau de menace basé sur le score"""
        if score >= 0.9: return 'Critique'
        if score >= 0.7: return 'Élevé'
        if score >= 0.5: return 'Moyen'
        if score >= 0.3: return 'Faible'
        return 'Informationnel'
    
    async def websocket_handler(self, websocket, path):
        """Gestionnaire WebSocket pour envoyer les données au frontend"""
        self.connected_clients.add(websocket)
        try:
            await websocket.wait_closed()
        finally:
            self.connected_clients.remove(websocket)
    
    async def broadcast_packets(self):
        """Diffuse les paquets capturés via WebSocket"""
        while True:
            if not self.packet_queue.empty() and self.connected_clients:
                packet_data = self.packet_queue.get()
                message = json.dumps(packet_data)
                
                # Envoyer à tous les clients connectés
                disconnected = []
                for client in self.connected_clients:
                    try:
                        await client.send(message)
                    except:
                        disconnected.append(client)
                
                # Nettoyer les clients déconnectés
                for client in disconnected:
                    self.connected_clients.discard(client)
            
            await asyncio.sleep(0.01)  # 10ms delay
    
    def start_capture(self, interface=None):
        """Démarre la capture de paquets"""
        print(f"Démarrage de la capture sur l'interface {interface or 'par défaut'}")
        self.is_capturing = True
        
        # Démarrer la capture Scapy dans un thread séparé
        capture_thread = threading.Thread(
            target=lambda: sniff(
                iface=interface,
                prn=self.packet_handler,
                stop_filter=lambda x: not self.is_capturing,
                store=False
            )
        )
        capture_thread.daemon = True
        capture_thread.start()
    
    def stop_capture(self):
        """Arrête la capture de paquets"""
        print("Arrêt de la capture")
        self.is_capturing = False
    
    async def run_server(self):
        """Démarre le serveur WebSocket"""
        print(f"Démarrage du serveur WebSocket sur le port {self.websocket_port}")
        
        # Démarrer le broadcaster
        asyncio.create_task(self.broadcast_packets())
        
        # Démarrer le serveur WebSocket
        await websockets.serve(self.websocket_handler, "localhost", self.websocket_port)
        
        print("Serveur prêt. Appuyez sur Ctrl+C pour arrêter.")
        
        # Garder le serveur en marche
        try:
            await asyncio.Future()  # run forever
        except KeyboardInterrupt:
            print("Arrêt du serveur...")
            self.stop_capture()

# Script principal
if __name__ == "__main__":
    # Chemin vers votre modèle RandomForest entraîné
    MODEL_PATH = "path/to/your/trained_model.pkl"
    
    # Interface réseau (None pour auto-détection)
    INTERFACE = None  # ou "eth0", "wlan0", etc.
    
    capture_service = SentinelPacketCapture(MODEL_PATH)
    
    # Démarrer la capture
    capture_service.start_capture(INTERFACE)
    
    # Démarrer le serveur WebSocket
    asyncio.run(capture_service.run_server())
```

## 2. Intégration Frontend

### Modification du Service de Capture

Remplacez le service de simulation par une connexion WebSocket réelle :

```typescript
// lib/real-packet-capture-service.ts
class RealPacketCaptureService {
  private websocket: WebSocket | null = null;
  private listeners: ((packet: NetworkPacket) => void)[] = [];
  
  connect(url: string = 'ws://localhost:8765') {
    this.websocket = new WebSocket(url);
    
    this.websocket.onmessage = (event) => {
      const packet = JSON.parse(event.data);
      this.notifyListeners(packet);
    };
    
    this.websocket.onopen = () => {
      console.log('Connecté au service de capture Python');
    };
    
    this.websocket.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
    };
  }
  
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }
  
  // ... reste des méthodes similaires au service de simulation
}
```

## 3. Configuration de Sécurité

### Permissions Requises

```bash
# Exécuter avec des privilèges root pour la capture de paquets
sudo python packet_capture_service.py

# Ou configurer les capacités (Linux)
sudo setcap cap_net_raw+ep /usr/bin/python3
```

### Filtrage des Paquets

```python
# Filtrer uniquement le trafic du réseau local
sniff(
    filter="net 192.168.156.0/24",
    iface=interface,
    prn=self.packet_handler
)
```

## 4. Déploiement

### Docker Setup

```dockerfile
# Dockerfile
FROM python:3.9

RUN apt-get update && apt-get install -y libpcap-dev

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY packet_capture_service.py .
COPY your_model.pkl .

CMD ["python", "packet_capture_service.py"]
```

### Configuration Réseau

```bash
# Permettre l'accès au Docker pour la capture
docker run --net=host --privileged sentinel-capture
```

## 5. Considérations de Performance

- **Filtrage** : Utilisez des filtres BPF pour réduire la charge
- **Batch Processing** : Traitez les paquets par lots pour les prédictions
- **Threading** : Séparez la capture, le traitement et l'envoi
- **Compression** : Compressez les données WebSocket si nécessaire

## 6. Surveillance et Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('sentinel_capture.log'),
        logging.StreamHandler()
    ]
)
```

## 7. Tests et Validation

### Test du Modèle

```python
# Validation du modèle avant déploiement
def validate_model(model_path, test_data_path):
    model = joblib.load(model_path)
    test_data = pd.read_csv(test_data_path)
    
    predictions = model.predict(test_data)
    print(f"Précision: {accuracy_score(test_data['label'], predictions)}")
```

### Test de Performance

```python
# Mesurer la latence de traitement
import time

start_time = time.time()
prediction = model.predict([feature_vector])
processing_time = time.time() - start_time
print(f"Temps de traitement: {processing_time:.3f}s")
```

## Notes Importantes

1. **Permissions** : La capture de paquets nécessite des privilèges élevés
2. **Performance** : Surveillez l'utilisation CPU et mémoire
3. **Réseau** : Testez sur différents types de trafic réseau
4. **Sécurité** : Chiffrez les communications WebSocket en production
5. **Scalabilité** : Considérez l'utilisation de Redis pour la mise en cache des résultats

Cette intégration vous permettra de connecter votre modèle Python existant à l'interface Sentinel IDS pour une surveillance en temps réel authentique.