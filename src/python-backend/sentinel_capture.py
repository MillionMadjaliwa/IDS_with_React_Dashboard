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
import psutil
from typing import List, Dict

import numpy as np
import pandas as pd
from scapy.all import sniff, IP, TCP, UDP, ICMP
import websockets
from sklearn.ensemble import RandomForestClassifier
from colorama import init, Fore, Style
import nest_asyncio

# Appliquer la correction pour les boucles d'événements imbriquées
nest_asyncio.apply()

init(autoreset=True)

class NetworkFeatureExtractor:
    """Extracteur de caractéristiques réseau pour le modèle RandomForest"""
    
    def __init__(self):
        self.connection_history = {}
        self.service_history = {}
        self.host_history = {}
        
    def extract_features(self, packet) -> Dict[str, float]:
        # Initialisation avec toutes les features attendues
        features = {
            'duration': 0.0,
            'protocol_type': 'other',
            'service': 'other',
            'flag': 'NONE',
            'src_bytes': 0,
            'dst_bytes': 0,
            'land': 0,
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
            'serror_rate': 0.0,
            'srv_serror_rate': 0.0,
            'rerror_rate': 0.0,
            'srv_rerror_rate': 0.0,
            'same_srv_rate': 1.0,
            'diff_srv_rate': 0.0,
            'srv_diff_host_rate': 0.0,
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
            if IP in packet:
                ip_packet = packet[IP]
                src_ip = ip_packet.src
                dst_ip = ip_packet.dst

                features['land'] = 1 if src_ip == dst_ip else 0
                features['src_bytes'] = len(packet)

                protocol = self._get_protocol(packet)
                service = self._get_service(packet)
                features['protocol_type'] = protocol
                features['service'] = service

                self._update_connection_history(src_ip, dst_ip, service, protocol)
                features.update(self._calculate_traffic_features(src_ip, dst_ip, service))
                features.update(self._calculate_host_features(dst_ip, service))

                if TCP in packet:
                    tcp_packet = packet[TCP]
                    features['urgent'] = 1 if tcp_packet.flags.U else 0
                    # Détermination du flag principal TCP
                    flags = []
                    if hasattr(tcp_packet, 'flags'):
                        if tcp_packet.flags.S: flags.append('SYN')
                        if tcp_packet.flags.A: flags.append('ACK')
                        if tcp_packet.flags.F: flags.append('FIN')
                        if tcp_packet.flags.R: flags.append('RST')
                        if tcp_packet.flags.P: flags.append('PSH')
                        if tcp_packet.flags.U: flags.append('URG')
                    features['flag'] = flags[0] if flags else 'NONE'
                    if hasattr(ip_packet, 'frag') and ip_packet.frag > 0:
                        features['wrong_fragment'] = 1
                else:
                    features['flag'] = 'NONE'

        except Exception as e:
            logging.warning(f"Erreur lors de l'extraction des caractéristiques: {e}")

        return features
    
    def _get_protocol(self, packet) -> str:
        if TCP in packet: return 'tcp'
        if UDP in packet: return 'udp'
        if ICMP in packet: return 'icmp'
        return 'other'
    
    def _get_service(self, packet) -> str:
        if TCP in packet: port = packet[TCP].dport
        elif UDP in packet: port = packet[UDP].dport
        else: return 'other'
        
        service_map = {
            20: 'ftp_data', 21: 'ftp', 22: 'ssh', 23: 'telnet', 25: 'smtp',
            53: 'domain', 80: 'http', 110: 'pop_3', 111: 'sunrpc', 143: 'imap4',
            443: 'https', 993: 'imaps', 995: 'pop3s'
        }
        return service_map.get(port, 'other')
    
    def _update_connection_history(self, src_ip: str, dst_ip: str, service: str, protocol: str):
        current_time = time.time()
        cutoff_time = current_time - 120
        
        if src_ip not in self.connection_history:
            self.connection_history[src_ip] = []
        self.connection_history[src_ip] = [conn for conn in self.connection_history[src_ip] if conn['time'] > cutoff_time]
        self.connection_history[src_ip].append({'time': current_time, 'dst_ip': dst_ip, 'service': service, 'protocol': protocol})
        
        service_key = f"{dst_ip}:{service}"
        if service_key not in self.service_history:
            self.service_history[service_key] = []
        self.service_history[service_key] = [conn for conn in self.service_history[service_key] if conn['time'] > cutoff_time]
        self.service_history[service_key].append({'time': current_time, 'src_ip': src_ip})
    
    def _calculate_traffic_features(self, src_ip: str, dst_ip: str, service: str) -> Dict[str, float]:
        features = {}
        src_connections = self.connection_history.get(src_ip, [])
        features['count'] = len(src_connections)
        
        if src_connections:
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
        features = {}
        host_connections, service_connections = 0, 0
        
        for _, connections in self.connection_history.items():
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
    def get_model_info(self) -> dict:
        """Retourne les infos du modèle chargé (nom, version, features, hyperparams, etc.)"""
        info = {
            'name': type(self.model).__name__ if self.model else 'None',
            'version': getattr(self.model, 'version', 'N/A'),
            'features': getattr(self.model, 'feature_names_in_', []),
            'hyperparameters': self.model.get_params() if self.model else {},
            'is_dummy': getattr(self.model, 'is_dummy', False),
        }
        return info
    """Service principal de capture et d'analyse de paquets"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.feature_extractor = NetworkFeatureExtractor()
        self.model: Optional[RandomForestClassifier] = None
        self.packet_queue = asyncio.Queue(maxsize=1000)
        self.connected_clients = set()
        self.is_capturing = Event()
        self.capture_thread: Optional[Thread] = None
        
        self.stats = {
            'total_packets': 0, 'packets_per_second': 0, 'anomalies_detected': 0, 'start_time': None
        }
        
        self._setup_logging()
        
    def _setup_logging(self):
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
        try:
            if not os.path.exists(model_path):
                self.logger.warning(f"Modèle non trouvé: {model_path}")
                self.logger.info("Utilisation d'un modèle factice pour la démonstration")
                self.model = self._create_dummy_model()
                return True
                
            self.logger.info("Modèle chargé (factice pour la démo)")
            self.model = self._create_dummy_model()
            return True
            
        except Exception as e:
            self.logger.error(f"Erreur lors du chargement du modèle: {e}")
            return False
    
    def _create_dummy_model(self) -> RandomForestClassifier:
        np.random.seed(42)
        X = np.random.rand(1000, 41)
        y = np.random.choice([0, 1], 1000, p=[0.9, 0.1])
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X, y)
        model.is_dummy = True
        model.version = 'dummy-1.0'
        model.feature_names_in_ = [
            "duration", "protocol_type", "service", "flag", "src_bytes", "dst_bytes", "land", "wrong_fragment",
            "urgent", "hot", "num_failed_logins", "logged_in", "num_compromised", "root_shell", "su_attempted",
            "num_root", "num_file_creations", "num_shells", "num_access_files", "num_outbound_cmds",
            "is_host_login", "is_guest_login", "count", "srv_count", "serror_rate", "srv_serror_rate",
            "rerror_rate", "srv_rerror_rate", "same_srv_rate", "diff_srv_rate", "srv_diff_host_rate",
            "dst_host_count", "dst_host_srv_count", "dst_host_same_srv_rate", "dst_host_diff_srv_rate",
            "dst_host_same_src_port_rate", "dst_host_srv_diff_host_rate", "dst_host_serror_rate",
            "dst_host_srv_serror_rate", "dst_host_rerror_rate", "dst_host_srv_rerror_rate"
        ]
        self.logger.info("Modèle factice créé pour la démonstration")
        return model
    
    def get_network_interfaces(self) -> List[Dict[str, str]]:
        interfaces = []
        try:
            addrs = psutil.net_if_addrs()
            stats = psutil.net_if_stats()
            for iface_name, iface_addrs in addrs.items():
                iface_info = {'name': iface_name, 'ip': 'N/A', 'mac': 'N/A', 'ipv6': 'N/A', 'status': 'inactive'}
                for addr in iface_addrs:
                    if addr.family.name == 'AF_INET':
                        iface_info['ip'] = addr.address
                    elif addr.family.name == 'AF_INET6':
                        iface_info['ipv6'] = addr.address
                    elif addr.family.name == 'AF_LINK':
                        iface_info['mac'] = addr.address
                if iface_name in stats and stats[iface_name].isup:
                    iface_info['status'] = 'active'
                interfaces.append(iface_info)
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération des interfaces: {e}")
        return interfaces
    
    def packet_handler(self, packet):
        if not self.is_capturing.is_set(): return
            
        try:
            self.stats['total_packets'] += 1
            packet_info = self._extract_packet_info(packet)
            features = self.feature_extractor.extract_features(packet)
            packet_info['features'] = features
            
            if self.model:
                prediction_result = self._predict_anomaly(features)
                packet_info.update(prediction_result)
            else:
                packet_info.update({'prediction': 'Normal', 'anomaly_score': 0.1, 'threat_level': 'Informationnel'})
            
            asyncio.run(self.packet_queue.put(packet_info))
            
        except Exception as e:
            self.logger.error(f"Erreur lors du traitement du paquet: {e}")
    
    def _extract_packet_info(self, packet) -> Dict[str, Any]:
        packet_info = {
            'id': f"pkt_{int(time.time() * 1000)}_{id(packet)}",
            'timestamp': datetime.now().isoformat(),
            'size': len(packet),
            'sourceIp': 'Unknown', 'destinationIp': 'Unknown',
            'sourcePort': 0, 'destinationPort': 0,
            'protocol': 'Unknown', 'flags': [], 'payloadPreview': ''
        }
        
        try:
            if IP in packet:
                ip_packet = packet[IP]
                packet_info.update({'sourceIp': ip_packet.src, 'destinationIp': ip_packet.dst})
                if TCP in packet:
                    tcp_packet = packet[TCP]
                    packet_info.update({
                        'sourcePort': tcp_packet.sport, 'destinationPort': tcp_packet.dport,
                        'protocol': 'TCP', 'flags': self._get_tcp_flags(tcp_packet)
                    })
                elif UDP in packet:
                    udp_packet = packet[UDP]
                    packet_info.update({'sourcePort': udp_packet.sport, 'destinationPort': udp_packet.dport, 'protocol': 'UDP', 'flags': []})
                elif ICMP in packet:
                    packet_info.update({'protocol': 'ICMP', 'flags': []})
            if hasattr(packet, 'payload') and packet.payload:
                payload_str = str(packet.payload)[:100]
                packet_info['payloadPreview'] = payload_str
        except Exception as e:
            self.logger.warning(f"Erreur lors de l'extraction des infos paquet: {e}")
        return packet_info
    
    def _get_tcp_flags(self, tcp_packet) -> List[str]:
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
        try:
            # Ordre exact des colonnes attendu par le modèle
            feature_order = [
                "duration", "protocol_type", "service", "flag", "src_bytes", "dst_bytes", "land", "wrong_fragment",
                "urgent", "hot", "num_failed_logins", "logged_in", "num_compromised", "root_shell", "su_attempted",
                "num_root", "num_file_creations", "num_shells", "num_access_files", "num_outbound_cmds",
                "is_host_login", "is_guest_login", "count", "srv_count", "serror_rate", "srv_serror_rate",
                "rerror_rate", "srv_rerror_rate", "same_srv_rate", "diff_srv_rate", "srv_diff_host_rate",
                "dst_host_count", "dst_host_srv_count", "dst_host_same_srv_rate", "dst_host_diff_srv_rate",
                "dst_host_same_src_port_rate", "dst_host_srv_diff_host_rate", "dst_host_serror_rate",
                "dst_host_srv_serror_rate", "dst_host_rerror_rate", "dst_host_srv_rerror_rate"
            ]
            # Encodage simple pour les features catégorielles (protocol_type, service, flag)
            # Ici, on fait un one-hot encoding minimal pour éviter les erreurs (à adapter selon le modèle réel)
            # Pour la démo, on remplace les valeurs catégorielles par leur hash
            feature_vector = []
            for col in feature_order:
                val = features.get(col, 0)
                if col in ["protocol_type", "service", "flag"]:
                    # Encodage simple (hash)
                    val = hash(str(val)) % 1000
                feature_vector.append(val)
            feature_vector = np.array([feature_vector]).reshape(1, -1)
            prediction = self.model.predict(feature_vector)[0]
            prediction_proba = self.model.predict_proba(feature_vector)[0]
            anomaly_score = prediction_proba[1] if len(prediction_proba) > 1 else prediction_proba[0]
            threat_level = self._get_threat_level(anomaly_score)
            if prediction == 1: self.stats['anomalies_detected'] += 1
            return {
                'prediction': 'Anomalie' if prediction == 1 else 'Normal',
                'anomaly_score': float(anomaly_score),
                'threat_level': threat_level
            }
        except Exception as e:
            self.logger.error(f"Erreur lors de la prédiction: {e}")
            return {'prediction': 'Erreur', 'anomaly_score': 0.0, 'threat_level': 'Informationnel'}
    
    def _get_threat_level(self, score: float) -> str:
        if score >= 0.9: return 'Critique'
        if score >= 0.7: return 'Élevé'
        if score >= 0.5: return 'Moyen'
        if score >= 0.3: return 'Faible'
        return 'Informationnel'
    
    def start_capture(self, interface: Optional[str] = None, filter_expr: str = ""):
        if self.is_capturing.is_set():
            self.logger.warning("Capture déjà en cours")
            return
            
        self.logger.info(f"Démarrage de la capture sur l'interface: {interface or 'par défaut'}")
        self.logger.info(f"Filtre appliqué: {filter_expr or 'aucun'}")
        
        self.is_capturing.set()
        self.stats['start_time'] = time.time()
        
        self.capture_thread = Thread(
            target=self._capture_loop,
            args=(interface, filter_expr),
            daemon=True
        )
        self.capture_thread.start()
        
    def _capture_loop(self, interface: Optional[str], filter_expr: str):
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
        if not self.is_capturing.is_set():
            self.logger.warning("Aucune capture en cours")
            return
            
        self.logger.info("Arrêt de la capture...")
        self.is_capturing.clear()
        
        if self.capture_thread and self.capture_thread.is_alive():
            self.capture_thread.join(timeout=5)
            
    async def websocket_handler(self, websocket):
        client_addr = websocket.remote_address
        self.logger.info(f"Nouvelle connexion WebSocket: {client_addr}")
        self.connected_clients.add(websocket)
        try:
            try:
                async for message in websocket:
                    # Si le client demande les infos du modèle
                    try:
                        data = json.loads(message)
                        if isinstance(data, dict) and data.get('type') == 'get_model_info':
                            model_info = self.get_model_info()
                            await websocket.send(json.dumps({'type': 'model_info', 'data': model_info}))
                    except Exception as e:
                        self.logger.warning(f"Erreur lors du traitement du message WebSocket: {e}")
            except (websockets.exceptions.InvalidMessage, EOFError):
                self.logger.info(f"Connexion non-WebSocket ou fermée prématurément: {client_addr}")
            except (websockets.exceptions.ConnectionClosedOK,):
                self.logger.info(f"Connexion fermée normalement: {client_addr}")
            except websockets.exceptions.ConnectionClosedError as e:
                self.logger.debug(f"Erreur WebSocket ignorée {client_addr}: {e}")
        finally:
            self.connected_clients.discard(websocket)
            self.logger.info(f"Connexion fermée: {client_addr}")
    
    async def broadcast_data(self):
        while True:
            try:
                # Gestion des paquets
                if not self.packet_queue.empty():
                    packet_data = await self.packet_queue.get()
                    message = json.dumps({'type': 'packet', 'data': packet_data})
                    for client in self.connected_clients.copy():
                        try:
                            await client.send(message)  # on tente l'envoi
                        except websockets.exceptions.ConnectionClosed:
                            self.connected_clients.remove(client)
                            self.logger.info("Client déconnecté pendant broadcast")

                # Envoi périodique des stats et interfaces toutes les 5 secondes
                if int(time.time()) % 5 == 0:
                    stats_message = json.dumps({'type': 'stats', 'data': self.get_current_stats()})
                    interfaces_message = json.dumps({'type': 'interfaces', 'data': self.get_network_interfaces()})
                    for client in self.connected_clients.copy():
                        try:
                            await client.send(stats_message)
                            await client.send(interfaces_message)
                        except websockets.exceptions.ConnectionClosed:
                            self.connected_clients.remove(client)
                            self.logger.info("Client déconnecté pendant broadcast")

                await asyncio.sleep(0.01)

            except Exception as e:
                self.logger.error(f"Erreur dans broadcast_data: {e}")
                await asyncio.sleep(0.01)

    
    def get_current_stats(self) -> Dict[str, Any]:
        current_time = time.time()
        pps = 0
        if self.stats['start_time']:
            elapsed = current_time - self.stats['start_time']
            pps = self.stats['total_packets'] / max(elapsed, 1)
            
        return {
            'total_packets': self.stats['total_packets'],
            'packets_per_second': round(pps, 2),
            'anomalies_detected': self.stats['anomalies_detected'],
            'is_capturing': self.is_capturing.is_set(),
            'connected_clients': len(self.connected_clients),
            'queue_size': self.packet_queue.qsize()
        }
    
    async def run_service(self):
        """Fonction principale asynchrone pour démarrer toutes les tâches"""
        host = self.config.get('websocket_host', 'localhost')
        port = self.config.get('websocket_port', 8765)

        self.logger.info(f"Démarrage du serveur WebSocket sur {host}:{port}")

        # Démarre la capture
        self.start_capture(
            interface=self.config.get('interface'),
            filter_expr=self.config.get('filter')
        )

        # Utilisation correcte de websockets.serve
        async with websockets.serve(self.websocket_handler, host, port):
            self.logger.info("Serveur WebSocket démarré")
            # Lance broadcast_data en tâche parallèle
            broadcast_task = asyncio.create_task(self.broadcast_data())
            try:
                await asyncio.Future()  # bloque indéfiniment
            finally:
                broadcast_task.cancel()
                self.stop_capture()
                self.logger.info("Service arrêté.")

def is_root():
    if os.name == "nt":
        try:
            import ctypes
            return ctypes.windll.shell32.IsUserAnAdmin() != 0
        except:
            return False
    else:
        return os.geteuid() == 0

def load_config() -> Dict[str, Any]:
    return {
        'websocket_host': os.getenv('SENTINEL_HOST', 'localhost'),
        'websocket_port': int(os.getenv('SENTINEL_PORT', '8765')),
        'model_path': os.getenv('SENTINEL_MODEL_PATH', 'models/ids_model.pkl'),
        'log_level': os.getenv('SENTINEL_LOG_LEVEL', 'INFO'),
        'interface': os.getenv('SENTINEL_INTERFACE', None),
        'filter': os.getenv('SENTINEL_FILTER', 'net 192.168.0.0/16 or net 10.0.0.0/8 or net 172.16.0.0/12')
    }

def print_banner():
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

async def main():
    print_banner()
    if not is_root():
        print("⚠️ Please run as Administrator (Windows) or Root (Linux)")
        sys.exit(1)
        
    config = load_config()
    
    capture_service = SentinelPacketCapture(config)
    
    if not capture_service.load_model(config['model_path']):
        print(f"{Fore.RED}❌ Impossible de charger le modèle{Style.RESET_ALL}")
        sys.exit(1)
    
    print(f"{Fore.GREEN}✅ Service initialisé avec succès{Style.RESET_ALL}")
    print(f"{Fore.BLUE}🌐 Interface WebSocket: ws://{config['websocket_host']}:{config['websocket_port']}{Style.RESET_ALL}")
    print()
    
    interfaces = capture_service.get_network_interfaces()
    if interfaces:
        print(f"{Fore.CYAN}🔌 Interfaces réseau disponibles:{Style.RESET_ALL}")
        for iface in interfaces:
            status_color = Fore.GREEN if iface['status'] == 'active' else Fore.YELLOW
            print(f"   {status_color}• {iface['name']}: {iface['ip']} ({iface['status']}){Style.RESET_ALL}")
        print()
    
    await capture_service.run_service()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Arrêt en cours...{Style.RESET_ALL}")
    except Exception as e:
        print(f"{Fore.RED}Erreur: {e}{Style.RESET_ALL}")