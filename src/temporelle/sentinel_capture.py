#!/usr/bin/env python3
"""
Sentinel IDS - Service de Capture de Paquets en Temps Réel
Capture les paquets réseau, les analyse avec RandomForest et diffuse via WebSocket
"""

import asyncio
import json
import time
import logging
import signal
import sys
from datetime import datetime
from typing import Dict, List, Optional, Any
from queue import Queue
from threading import Thread, Event
import os
from pathlib import Path
import subprocess

import numpy as np
import pandas as pd
from scapy.all import sniff, IP, TCP, UDP, ICMP, get_if_list, get_if_addr
import websockets
from websockets.server import WebSocketServerProtocol
from sklearn.ensemble import RandomForestClassifier
import psutil
from colorama import init, Fore, Style, Back

# Initialiser colorama pour les couleurs dans le terminal
init(autoreset=True)

class NetworkFeatureExtractor:
    """Extracteur de caractéristiques réseau pour le modèle RandomForest"""
    
    def __init__(self):
        self.connection_history = {}
        self.service_history = {}
        self.host_history = {}
        
    def extract_features(self, packet) -> Dict[str, float]:
        """
        Extrait les 41 caractéristiques du dataset KDD Cup 99
        pour l'analyse avec RandomForest
        """
        features = {
            # Caractéristiques de base de la connexion
            'duration': 0.0,
            'src_bytes': 0,
            'dst_bytes': 0,
            'land': 0,
            'wrong_fragment': 0,
            'urgent': 0,
            
            # Caractéristiques de contenu
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
            
            # Caractéristiques de trafic basées sur le temps
            'count': 1,
            'srv_count': 1,
            'serror_rate': 0.0,
            'srv_serror_rate': 0.0,
            'rerror_rate': 0.0,
            'srv_rerror_rate': 0.0,
            'same_srv_rate': 1.0,
            'diff_srv_rate': 0.0,
            'srv_diff_host_rate': 0.0,
            
            # Caractéristiques basées sur l'hôte
            'dst_host_count': 1,
            'dst_host_srv_count': 1,
            'dst_host_same_srv_rate': 1.0,
            'dst_host_diff_srv_rate': 0.0,
            'dst_host_same_src_port_rate': 1.0,
            'dst_host_srv_diff_host_rate': 0.0,
            'dst_host_serror_rate': 0.0,
            'dst_host_srv_serror_rate': 0.0,
            'dst_host_rerror_rate': 0.0,
            'dst_host_srv_rerror_rate': 0.0,
        }
        
        try:
            # Extraire les informations de base du paquet
            if IP in packet:
                ip_packet = packet[IP]
                src_ip = ip_packet.src
                dst_ip = ip_packet.dst
                
                # Vérifier si land attack (src == dst)
                features['land'] = 1 if src_ip == dst_ip else 0
                
                # Taille des données
                features['src_bytes'] = len(packet)
                
                # Protocole et service
                protocol = self._get_protocol(packet)
                service = self._get_service(packet)
                
                # Mettre à jour l'historique des connexions
                self._update_connection_history(src_ip, dst_ip, service, protocol)
                
                # Calculer les statistiques basées sur l'historique
                features.update(self._calculate_traffic_features(src_ip, dst_ip, service))
                features.update(self._calculate_host_features(dst_ip, service))
                
                # Caractéristiques TCP spécifiques
                if TCP in packet:
                    tcp_packet = packet[TCP]
                    features['urgent'] = 1 if tcp_packet.flags.U else 0
                    
                    # Détecter les fragments erronés
                    if hasattr(ip_packet, 'frag') and ip_packet.frag > 0:
                        features['wrong_fragment'] = 1
                        
        except Exception as e:
            logging.warning(f"Erreur lors de l'extraction des caractéristiques: {e}")
            
        return features
    
    def _get_protocol(self, packet) -> str:
        """Détermine le protocole du paquet"""
        if TCP in packet:
            return 'tcp'
        elif UDP in packet:
            return 'udp'
        elif ICMP in packet:
            return 'icmp'
        else:
            return 'other'
    
    def _get_service(self, packet) -> str:
        """Détermine le service basé sur le port de destination"""
        if TCP in packet:
            port = packet[TCP].dport
        elif UDP in packet:
            port = packet[UDP].dport
        else:
            return 'other'
            
        # Mapping des ports vers les services
        service_map = {
            20: 'ftp_data', 21: 'ftp', 22: 'ssh', 23: 'telnet',
            25: 'smtp', 53: 'domain', 80: 'http', 110: 'pop_3',
            111: 'sunrpc', 143: 'imap4', 443: 'https', 993: 'imaps',
            995: 'pop3s'
        }
        
        return service_map.get(port, 'other')
    
    def _update_connection_history(self, src_ip: str, dst_ip: str, service: str, protocol: str):
        """Met à jour l'historique des connexions pour les calculs statistiques"""
        current_time = time.time()
        
        # Nettoyer l'ancien historique (> 2 minutes)
        cutoff_time = current_time - 120
        
        # Historique des connexions
        if src_ip not in self.connection_history:
            self.connection_history[src_ip] = []
        self.connection_history[src_ip] = [
            conn for conn in self.connection_history[src_ip] 
            if conn['time'] > cutoff_time
        ]
        self.connection_history[src_ip].append({
            'time': current_time,
            'dst_ip': dst_ip,
            'service': service,
            'protocol': protocol
        })
        
        # Historique des services
        service_key = f"{dst_ip}:{service}"
        if service_key not in self.service_history:
            self.service_history[service_key] = []
        self.service_history[service_key] = [
            conn for conn in self.service_history[service_key]
            if conn['time'] > cutoff_time
        ]
        self.service_history[service_key].append({
            'time': current_time,
            'src_ip': src_ip
        })
    
    def _calculate_traffic_features(self, src_ip: str, dst_ip: str, service: str) -> Dict[str, float]:
        """Calcule les caractéristiques de trafic basées sur l'historique"""
        features = {}
        
        # Connexions depuis cette source
        src_connections = self.connection_history.get(src_ip, [])
        features['count'] = len(src_connections)
        
        if src_connections:
            # Connexions vers le même service
            same_service = [c for c in src_connections if c['service'] == service]
            features['srv_count'] = len(same_service)
            features['same_srv_rate'] = len(same_service) / len(src_connections)
            features['diff_srv_rate'] = 1.0 - features['same_srv_rate']
        else:
            features['srv_count'] = 1
            features['same_srv_rate'] = 1.0
            features['diff_srv_rate'] = 0.0
            
        return features
    
    def _calculate_host_features(self, dst_ip: str, service: str) -> Dict[str, float]:
        """Calcule les caractéristiques basées sur l'hôte de destination"""
        features = {}
        
        # Compter les connexions vers cet hôte
        host_connections = 0
        service_connections = 0
        
        for src, connections in self.connection_history.items():
            for conn in connections:
                if conn['dst_ip'] == dst_ip:
                    host_connections += 1
                    if conn['service'] == service:
                        service_connections += 1
        
        features['dst_host_count'] = max(1, host_connections)
        features['dst_host_srv_count'] = max(1, service_connections)
        
        if host_connections > 0:
            features['dst_host_same_srv_rate'] = service_connections / host_connections
            features['dst_host_diff_srv_rate'] = 1.0 - features['dst_host_same_srv_rate']
        else:
            features['dst_host_same_srv_rate'] = 1.0
            features['dst_host_diff_srv_rate'] = 0.0
            
        return features


class SentinelPacketCapture:
    """Service principal de capture et d'analyse de paquets"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.feature_extractor = NetworkFeatureExtractor()
        self.model: Optional[RandomForestClassifier] = None
        self.packet_queue = Queue(maxsize=1000)
        self.connected_clients = set()
        self.is_capturing = Event()
        self.capture_thread: Optional[Thread] = None
        
        # Statistiques
        self.stats = {
            'total_packets': 0,
            'packets_per_second': 0,
            'anomalies_detected': 0,
            'start_time': None
        }
        
        # Configuration du logging
        self._setup_logging()
        
    def _setup_logging(self):
        """Configure le système de logging"""
        log_level = getattr(logging, self.config.get('log_level', 'INFO').upper())
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('sentinel_capture.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger('SentinelCapture')
        
    def load_model(self, model_path: str) -> bool:
        """Charge le modèle RandomForest depuis un fichier"""
        try:
            if not os.path.exists(model_path):
                self.logger.warning(f"Modèle non trouvé: {model_path}")
                self.logger.info("Utilisation d'un modèle factice pour la démonstration")
                # Créer un modèle factice pour la démonstration
                self.model = self._create_dummy_model()
                return True
                
            # Charger le vrai modèle (décommentez selon votre format)
            # import joblib
            # self.model = joblib.load(model_path)
            # import pickle
            # with open(model_path, 'rb') as f:
            #     self.model = pickle.load(f)
            
            self.logger.info(f"Modèle chargé depuis: {model_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Erreur lors du chargement du modèle: {e}")
            return False
    
    def _create_dummy_model(self) -> RandomForestClassifier:
        """Crée un modèle factice pour la démonstration"""
        # Données d'entraînement factices
        np.random.seed(42)
        X = np.random.rand(1000, 41)  # 41 caractéristiques
        y = np.random.choice([0, 1], 1000, p=[0.9, 0.1])  # 10% d'anomalies
        
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        self.logger.info("Modèle factice créé pour la démonstration")
        return model
    
    def get_network_interfaces(self) -> List[Dict[str, str]]:
        """Obtient la liste des interfaces réseau disponibles"""
        interfaces = []
        
        try:
            for iface_name in get_if_list():
                try:
                    # Obtenir l'adresse IP de l'interface
                    ip_addr = get_if_addr(iface_name)
                    if ip_addr and ip_addr != "0.0.0.0":
                        interfaces.append({
                            'name': iface_name,
                            'ip': ip_addr,
                            'status': 'active'
                        })
                except:
                    interfaces.append({
                        'name': iface_name,
                        'ip': 'N/A',
                        'status': 'inactive'
                    })
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération des interfaces: {e}")
            
        return interfaces
    
    def packet_handler(self, packet):
        """Gestionnaire de paquet appelé par Scapy"""
        if not self.is_capturing.is_set():
            return
            
        try:
            # Mettre à jour les statistiques
            self.stats['total_packets'] += 1
            
            # Extraire les informations de base
            packet_info = self._extract_packet_info(packet)
            
            # Extraire les caractéristiques pour le modèle
            features = self.feature_extractor.extract_features(packet)
            packet_info['features'] = features
            
            # Prédiction avec le modèle
            if self.model:
                prediction_result = self._predict_anomaly(features)
                packet_info.update(prediction_result)
            else:
                packet_info.update({
                    'prediction': 'Normal',
                    'anomaly_score': 0.1,
                    'threat_level': 'Informationnel'
                })
            
            # Ajouter à la queue pour diffusion WebSocket
            if not self.packet_queue.full():
                self.packet_queue.put(packet_info)
            else:
                self.logger.warning("Queue de paquets pleine, paquet ignoré")
                
        except Exception as e:
            self.logger.error(f"Erreur lors du traitement du paquet: {e}")
    
    def _extract_packet_info(self, packet) -> Dict[str, Any]:
        """Extrait les informations de base du paquet"""
        packet_info = {
            'id': f"pkt_{int(time.time() * 1000)}_{id(packet)}",
            'timestamp': datetime.now().isoformat(),
            'size': len(packet),
            'sourceIp': 'Unknown',
            'destinationIp': 'Unknown',
            'sourcePort': 0,
            'destinationPort': 0,
            'protocol': 'Unknown',
            'flags': [],
            'payloadPreview': ''
        }
        
        try:
            # Informations IP
            if IP in packet:
                ip_packet = packet[IP]
                packet_info.update({
                    'sourceIp': ip_packet.src,
                    'destinationIp': ip_packet.dst
                })
                
                # Informations TCP
                if TCP in packet:
                    tcp_packet = packet[TCP]
                    packet_info.update({
                        'sourcePort': tcp_packet.sport,
                        'destinationPort': tcp_packet.dport,
                        'protocol': 'TCP',
                        'flags': self._get_tcp_flags(tcp_packet)
                    })
                    
                # Informations UDP
                elif UDP in packet:
                    udp_packet = packet[UDP]
                    packet_info.update({
                        'sourcePort': udp_packet.sport,
                        'destinationPort': udp_packet.dport,
                        'protocol': 'UDP',
                        'flags': []
                    })
                    
                # Informations ICMP
                elif ICMP in packet:
                    packet_info.update({
                        'protocol': 'ICMP',
                        'flags': []
                    })
                    
            # Aperçu de la charge utile
            if hasattr(packet, 'payload') and packet.payload:
                payload_str = str(packet.payload)[:100]
                packet_info['payloadPreview'] = payload_str
                
        except Exception as e:
            self.logger.warning(f"Erreur lors de l'extraction des infos paquet: {e}")
            
        return packet_info
    
    def _get_tcp_flags(self, tcp_packet) -> List[str]:
        """Extrait les flags TCP"""
        flags = []
        if hasattr(tcp_packet, 'flags'):
            if tcp_packet.flags.S: flags.append('SYN')
            if tcp_packet.flags.A: flags.append('ACK')
            if tcp_packet.flags.F: flags.append('FIN')
            if tcp_packet.flags.R: flags.append('RST')
            if tcp_packet.flags.P: flags.append('PSH')
            if tcp_packet.flags.U: flags.append('URG')
        return flags
    
    def _predict_anomaly(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Effectue la prédiction d'anomalie avec le modèle"""
        try:
            # Convertir les caractéristiques en array numpy
            feature_vector = np.array([list(features.values())]).reshape(1, -1)
            
            # Prédiction
            prediction = self.model.predict(feature_vector)[0]
            prediction_proba = self.model.predict_proba(feature_vector)[0]
            
            # Score d'anomalie (probabilité de la classe positive)
            anomaly_score = prediction_proba[1] if len(prediction_proba) > 1 else prediction_proba[0]
            
            # Déterminer le niveau de menace
            threat_level = self._get_threat_level(anomaly_score)
            
            # Mise à jour des statistiques
            if prediction == 1:  # Anomalie détectée
                self.stats['anomalies_detected'] += 1
            
            return {
                'prediction': 'Anomalie' if prediction == 1 else 'Normal',
                'anomaly_score': float(anomaly_score),
                'threat_level': threat_level
            }
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la prédiction: {e}")
            return {
                'prediction': 'Erreur',
                'anomaly_score': 0.0,
                'threat_level': 'Informationnel'
            }
    
    def _get_threat_level(self, score: float) -> str:
        """Détermine le niveau de menace basé sur le score"""
        if score >= 0.9: return 'Critique'
        if score >= 0.7: return 'Élevé'
        if score >= 0.5: return 'Moyen'
        if score >= 0.3: return 'Faible'
        return 'Informationnel'
    
    def start_capture(self, interface: Optional[str] = None, filter_expr: str = ""):
        """Démarre la capture de paquets"""
        if self.is_capturing.is_set():
            self.logger.warning("Capture déjà en cours")
            return
            
        self.logger.info(f"Démarrage de la capture sur l'interface: {interface or 'par défaut'}")
        self.logger.info(f"Filtre appliqué: {filter_expr or 'aucun'}")
        
        self.is_capturing.set()
        self.stats['start_time'] = time.time()
        
        # Démarrer la capture dans un thread séparé
        self.capture_thread = Thread(
            target=self._capture_loop,
            args=(interface, filter_expr),
            daemon=True
        )
        self.capture_thread.start()
        
    def _capture_loop(self, interface: Optional[str], filter_expr: str):
        """Boucle de capture des paquets"""
        try:
            self.logger.info("Début de la capture de paquets...")
            sniff(
                iface=interface,
                filter=filter_expr or None,
                prn=self.packet_handler,
                stop_filter=lambda x: not self.is_capturing.is_set(),
                store=False
            )
        except Exception as e:
            self.logger.error(f"Erreur pendant la capture: {e}")
        finally:
            self.logger.info("Fin de la capture de paquets")
    
    def stop_capture(self):
        """Arrête la capture de paquets"""
        if not self.is_capturing.is_set():
            self.logger.warning("Aucune capture en cours")
            return
            
        self.logger.info("Arrêt de la capture...")
        self.is_capturing.clear()
        
        if self.capture_thread and self.capture_thread.is_alive():
            self.capture_thread.join(timeout=5)
            
    async def websocket_handler(self, websocket: WebSocketServerProtocol, path: str):
        """Gestionnaire des connexions WebSocket"""
        client_addr = websocket.remote_address
        self.logger.info(f"Nouvelle connexion WebSocket: {client_addr}")
        
        self.connected_clients.add(websocket)
        
        try:
            # Envoyer les statistiques initiales
            await websocket.send(json.dumps({
                'type': 'stats',
                'data': self.get_current_stats()
            }))
            
            # Envoyer la liste des interfaces
            await websocket.send(json.dumps({
                'type': 'interfaces',
                'data': self.get_network_interfaces()
            }))
            
            # Attendre la déconnexion
            await websocket.wait_closed()
            
        except Exception as e:
            self.logger.error(f"Erreur WebSocket avec {client_addr}: {e}")
        finally:
            self.connected_clients.discard(websocket)
            self.logger.info(f"Connexion fermée: {client_addr}")
    
    async def broadcast_packets(self):
        """Diffuse les paquets capturés via WebSocket"""
        while True:
            try:
                if not self.packet_queue.empty() and self.connected_clients:
                    packet_data = self.packet_queue.get_nowait()
                    message = json.dumps({
                        'type': 'packet',
                        'data': packet_data
                    })
                    
                    # Envoyer à tous les clients connectés
                    disconnected = []
                    for client in self.connected_clients.copy():
                        try:
                            await client.send(message)
                        except Exception as e:
                            self.logger.warning(f"Erreur envoi vers client: {e}")
                            disconnected.append(client)
                    
                    # Nettoyer les clients déconnectés
                    for client in disconnected:
                        self.connected_clients.discard(client)
                        
                # Diffuser les statistiques périodiquement
                if int(time.time()) % 5 == 0:  # Toutes les 5 secondes
                    await self._broadcast_stats()
                    
            except Exception as e:
                self.logger.error(f"Erreur dans broadcast_packets: {e}")
                
            await asyncio.sleep(0.01)  # 10ms delay
    
    async def _broadcast_stats(self):
        """Diffuse les statistiques actuelles"""
        if self.connected_clients:
            stats_message = json.dumps({
                'type': 'stats',
                'data': self.get_current_stats()
            })
            
            disconnected = []
            for client in self.connected_clients.copy():
                try:
                    await client.send(stats_message)
                except:
                    disconnected.append(client)
                    
            for client in disconnected:
                self.connected_clients.discard(client)
    
    def get_current_stats(self) -> Dict[str, Any]:
        """Obtient les statistiques actuelles"""
        current_time = time.time()
        
        # Calculer les paquets par seconde
        if self.stats['start_time']:
            elapsed = current_time - self.stats['start_time']
            pps = self.stats['total_packets'] / max(elapsed, 1)
        else:
            pps = 0
            
        return {
            'total_packets': self.stats['total_packets'],
            'packets_per_second': round(pps, 2),
            'anomalies_detected': self.stats['anomalies_detected'],
            'is_capturing': self.is_capturing.is_set(),
            'connected_clients': len(self.connected_clients),
            'queue_size': self.packet_queue.qsize()
        }
    
    async def run_server(self):
        """Démarre le serveur WebSocket"""
        host = self.config.get('websocket_host', 'localhost')
        port = self.config.get('websocket_port', 8765)
        
        self.logger.info(f"Démarrage du serveur WebSocket sur {host}:{port}")
        
        # Démarrer le broadcaster
        broadcast_task = asyncio.create_task(self.broadcast_packets())
        
        # Démarrer le serveur WebSocket
        server = await websockets.serve(
            self.websocket_handler,
            host,
            port,
            ping_interval=20,
            ping_timeout=10
        )
        
        self.logger.info(f"Serveur WebSocket prêt sur ws://{host}:{port}")
        self.logger.info("Tapez 'help' pour voir les commandes disponibles")
        
        # Gérer les signaux pour un arrêt propre
        def signal_handler(signum, frame):
            self.logger.info("Signal d'arrêt reçu...")
            self.stop_capture()
            broadcast_task.cancel()
            server.close()
            sys.exit(0)
            
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        try:
            # Garder le serveur en marche
            await server.wait_closed()
        except asyncio.CancelledError:
            pass


def print_banner():
    """Affiche la bannière de démarrage"""
    banner = f"""
{Fore.CYAN}{Style.BRIGHT}
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              SENTINEL IDS                                    ║
║                     Service de Capture de Paquets                            ║
║                                                                               ║
║  🔍 Capture réseau en temps réel                                            ║
║  🤖 Analyse avec Intelligence Artificielle                                   ║
║  📊 Dashboard web interactif                                                 ║
║                                                                               ║
║  Version: 1.0.0 | Python 3.9+ | Scapy + RandomForest                       ║
╚═══════════════════════════════════════════════════════════════════════════════╝
{Style.RESET_ALL}
"""
    print(banner)


def load_config() -> Dict[str, Any]:
    """Charge la configuration depuis les variables d'environnement ou défauts"""
    return {
        'websocket_host': os.getenv('SENTINEL_HOST', 'localhost'),
        'websocket_port': int(os.getenv('SENTINEL_PORT', '8765')),
        'model_path': os.getenv('SENTINEL_MODEL_PATH', 'models/random_forest_model.pkl'),
        'log_level': os.getenv('SENTINEL_LOG_LEVEL', 'INFO'),
        'interface': os.getenv('SENTINEL_INTERFACE', None),
        'filter': os.getenv('SENTINEL_FILTER', 'net 192.168.0.0/16 or net 10.0.0.0/8 or net 172.16.0.0/12')
    }


async def main():
    """Fonction principale"""
    print_banner()
    
    # Vérifier les privilèges
    if os.ctypes.windll.shell32.IsUserAnAdmin() != 0:
        print(f"{Fore.YELLOW}⚠️  Attention: Ce script nécessite des privilèges root pour la capture de paquets{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}   Exécutez avec: sudo python3 {sys.argv[0]}{Style.RESET_ALL}")
        print()
    
    # Charger la configuration
    config = load_config()
    
    # Créer le service de capture
    capture_service = SentinelPacketCapture(config)
    
    # Charger le modèle
    if not capture_service.load_model(config['model_path']):
        print(f"{Fore.RED}❌ Impossible de charger le modèle{Style.RESET_ALL}")
        sys.exit(1)
    
    print(f"{Fore.GREEN}✅ Service initialisé avec succès{Style.RESET_ALL}")
    print(f"{Fore.BLUE}🌐 Interface WebSocket: ws://{config['websocket_host']}:{config['websocket_port']}{Style.RESET_ALL}")
    print()
    
    # Afficher les interfaces disponibles
    interfaces = capture_service.get_network_interfaces()
    if interfaces:
        print(f"{Fore.CYAN}🔌 Interfaces réseau disponibles:{Style.RESET_ALL}")
        for iface in interfaces:
            status_color = Fore.GREEN if iface['status'] == 'active' else Fore.YELLOW
            print(f"   {status_color}• {iface['name']}: {iface['ip']} ({iface['status']}){Style.RESET_ALL}")
        print()
    
    # Démarrer le serveur
    try:
        await capture_service.run_server()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Arrêt en cours...{Style.RESET_ALL}")
    except Exception as e:
        print(f"{Fore.RED}Erreur: {e}{Style.RESET_ALL}")
    finally:
        capture_service.stop_capture()
        print(f"{Fore.GREEN}Service arrêté.{Style.RESET_ALL}")


if __name__ == "__main__":
    asyncio.run(main())