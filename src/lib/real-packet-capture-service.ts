import { FallbackSimulationService } from "./fallback-simulation-service";
// Singleton simulation fallback
const fallbackSimulation = new FallbackSimulationService();

let simulationActive = false;
export interface ModelInfo {
  name: string;
  version: string;
  features: string[];
  hyperparameters: Record<string, any>;
  is_dummy?: boolean;
}
/**
 * Service de capture de paquets réels via WebSocket
 * Se connecte au service Python pour recevoir les données en temps réel
 */

export interface NetworkPacket {
  id: string;
  timestamp: Date;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'HTTP' | 'HTTPS' | 'DNS' | 'SSH' | 'FTP';
  size: number;
  flags: string[];
  payloadPreview: string;
  threat_level: 'Informationnel' | 'Faible' | 'Moyen' | 'Élevé' | 'Critique';
  anomaly_score: number;
  prediction: 'Normal' | 'Anomalie';
  features: {
    duration: number;
    src_bytes: number;
    dst_bytes: number;
    land: number;
    wrong_fragment: number;
    urgent: number;
    hot: number;
    num_failed_logins: number;
    logged_in: number;
    num_compromised: number;
    root_shell: number;
    su_attempted: number;
    num_root: number;
    num_file_creations: number;
    num_shells: number;
    num_access_files: number;
    num_outbound_cmds: number;
    is_host_login: number;
    is_guest_login: number;
    count: number;
    srv_count: number;
    serror_rate: number;
    srv_serror_rate: number;
    rerror_rate: number;
    srv_rerror_rate: number;
    same_srv_rate: number;
    diff_srv_rate: number;
    srv_diff_host_rate: number;
    dst_host_count: number;
    dst_host_srv_count: number;
    dst_host_same_srv_rate: number;
    dst_host_diff_srv_rate: number;
    dst_host_same_src_port_rate: number;
    dst_host_srv_diff_host_rate: number;
    dst_host_serror_rate: number;
    dst_host_srv_serror_rate: number;
    dst_host_rerror_rate: number;
    dst_host_srv_rerror_rate: number;
  };
}

export interface NetworkInterface {
  name: string;
  ip: string;
  status: 'active' | 'inactive';
}

export interface CaptureStats {
  total_packets: number;
  packets_per_second: number;
  anomalies_detected: number;
  is_capturing: boolean;
  connected_clients: number;
  queue_size: number;
}

export interface WebSocketMessage {
  type: 'packet' | 'stats' | 'interfaces' | 'error' | 'status';
  data: any;
}

class RealPacketCaptureService {
  // Appelle ceci si la connexion réelle échoue
  private startSimulationIfNeeded() {
    if (!simulationActive) {
      fallbackSimulation.start();
      simulationActive = true;
    }
  }

  // Appelle ceci si la connexion réelle réussit
  private stopSimulationIfNeeded() {
    if (simulationActive) {
      fallbackSimulation.stop();
      simulationActive = false;
    }
  }
  // Récupère dynamiquement les infos du modèle via WebSocket
  async getModelInfo(): Promise<ModelInfo | null> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket non connectée');
    }
    return new Promise((resolve, reject) => {
      const ws = this.websocket;
      if (!ws) {
        reject(new Error('WebSocket non connectée'));
        return;
      }
      const handler = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'model_info') {
            ws.removeEventListener('message', handler);
            resolve(msg.data);
          }
        } catch (e) {
          // ignore
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ type: 'get_model_info' }));
      setTimeout(() => {
        ws.removeEventListener('message', handler);
        reject(new Error('Timeout model_info'));
      }, 3000);
    });
  }
  private websocket: WebSocket | null = null;
  private listeners: ((packet: NetworkPacket) => void)[] = [];
  private statsListeners: ((stats: CaptureStats) => void)[] = [];
  private interfaceListeners: ((interfaces: NetworkInterface[]) => void)[] = [];
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private connectionListeners: ((status: string) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // ms
  private reconnectTimer: NodeJS.Timeout | null = null;

  // Configuration par défaut
  private readonly defaultConfig = {
    url: 'ws://localhost:8765',
    autoReconnect: true,
    heartbeatInterval: 30000 // 30 secondes
  };

  private config = { ...this.defaultConfig };
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<typeof RealPacketCaptureService.prototype.config>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  // Méthodes de connexion WebSocket
  connect(url?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = url || this.config.url;

      // Always create a new WebSocket if not open, even after previous disconnect/error
      if (this.websocket) {
        if (this.websocket.readyState === WebSocket.OPEN) {
          this.stopSimulationIfNeeded();
          resolve();
          return;
        }
        // Clean up previous event handlers and instance
        this.websocket.onopen = null;
        this.websocket.onmessage = null;
        this.websocket.onclose = null;
        this.websocket.onerror = null;
        try { this.websocket.close(); } catch {}
        this.websocket = null;
      }

      this.setConnectionStatus('connecting');
      console.log(`🔌 Connexion au service de capture Python: ${wsUrl}`);

      try {
        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
          console.log('✅ Connexion WebSocket établie');
          this.setConnectionStatus('connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.stopSimulationIfNeeded();
          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.websocket.onclose = (event) => {
          this.setConnectionStatus('disconnected');
          this.stopHeartbeat();

          // Messages d'erreur spécifiques selon le code de fermeture
          if (event.code === 1006) {
            console.log('⚠️ Service Python fermé ou non disponible');
          } else if (event.code === 1000) {
            console.log('✅ Connexion fermée proprement');
          } else {
            console.log('🔌 Connexion fermée, code:', event.code);
          }

          // Ne pas essayer de se reconnecter automatiquement pour éviter les erreurs
          // L'utilisateur peut manuellement essayer de se reconnecter
          this.startSimulationIfNeeded();
        };

        this.websocket.onerror = (error) => {
          console.log('⚠️ Service Python non disponible sur', wsUrl);
          this.setConnectionStatus('error');

          // Créer un message d'erreur informatif
          let errorMessage = 'Service Python non disponible';
          if (wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1')) {
            errorMessage = 'Service Python local non démarré. L\'application va utiliser le mode simulation.';
          } else {
            errorMessage = `Service non accessible à ${wsUrl}. Basculement vers le mode simulation.`;
          }

          this.startSimulationIfNeeded();
          reject(new Error(errorMessage));
        };

        // Timeout de connexion
        setTimeout(() => {
          if (this.websocket?.readyState !== WebSocket.OPEN) {
            this.websocket?.close();
            this.startSimulationIfNeeded();
            reject(new Error('Timeout de connexion'));
          }
        }, 10000); // 10 secondes

      } catch (error) {
        console.error('❌ Erreur lors de la création de la connexion WebSocket:', error);
        this.setConnectionStatus('error');
        this.startSimulationIfNeeded();
        reject(error);
      }
    });
  }

  disconnect(): void {
    console.log('🔌 Déconnexion du service de capture...');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();
    
    if (this.websocket) {
      this.websocket.close(1000, 'Déconnexion demandée');
      this.websocket = null;
    }
    
    this.setConnectionStatus('disconnected');
  }

  private setConnectionStatus(status: typeof this.connectionStatus): void {
    this.connectionStatus = status;
    this.connectionListeners.forEach(listener => listener(status));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Backoff exponentiel
    
    console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(error => {
        console.error('Échec de la reconnexion:', error);
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      switch (message.type) {
        case 'packet':
          this.handlePacketMessage(message.data);
          break;
          
        case 'stats':
          this.handleStatsMessage(message.data);
          break;
          
        case 'interfaces':
          this.handleInterfacesMessage(message.data);
          break;
          
        case 'error':
          console.error('Erreur du service Python:', message.data);
          break;
          
        case 'status':
          console.log('Statut du service:', message.data);
          break;
          
        default:
          console.warn('Type de message inconnu:', message.type);
      }
    } catch (error) {
      console.error('Erreur lors du parsing du message WebSocket:', error);
    }
  }

  private handlePacketMessage(packetData: any): void {
    try {
      // Transformer les données Python en format NetworkPacket
      const packet: NetworkPacket = {
        id: packetData.id,
        timestamp: new Date(packetData.timestamp),
        sourceIp: packetData.sourceIp,
        destinationIp: packetData.destinationIp,
        sourcePort: packetData.sourcePort || 0,
        destinationPort: packetData.destinationPort || 0,
        protocol: this.normalizeProtocol(packetData.protocol),
        size: packetData.size || 0,
        flags: packetData.flags || [],
        payloadPreview: packetData.payloadPreview || '',
        threat_level: packetData.threat_level || 'Informationnel',
        anomaly_score: packetData.anomaly_score || 0,
        prediction: packetData.prediction || 'Normal',
        features: packetData.features || this.getDefaultFeatures()
      };

      this.notifyPacketListeners(packet);
    } catch (error) {
      console.error('Erreur lors du traitement du paquet:', error);
    }
  }

  private normalizeProtocol(protocol: string): NetworkPacket['protocol'] {
    const protocolUpper = protocol.toUpperCase();
    const validProtocols: NetworkPacket['protocol'][] = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS', 'SSH', 'FTP'];
    
    if (validProtocols.includes(protocolUpper as NetworkPacket['protocol'])) {
      return protocolUpper as NetworkPacket['protocol'];
    }
    
    // Mapper certains protocoles
    const protocolMap: Record<string, NetworkPacket['protocol']> = {
      'UNKNOWN': 'TCP',
      'OTHER': 'TCP'
    };
    
    return protocolMap[protocolUpper] || 'TCP';
  }

  private getDefaultFeatures(): NetworkPacket['features'] {
    return {
      duration: 0,
      src_bytes: 0,
      dst_bytes: 0,
      land: 0,
      wrong_fragment: 0,
      urgent: 0,
      hot: 0,
      num_failed_logins: 0,
      logged_in: 0,
      num_compromised: 0,
      root_shell: 0,
      su_attempted: 0,
      num_root: 0,
      num_file_creations: 0,
      num_shells: 0,
      num_access_files: 0,
      num_outbound_cmds: 0,
      is_host_login: 0,
      is_guest_login: 0,
      count: 1,
      srv_count: 1,
      serror_rate: 0,
      srv_serror_rate: 0,
      rerror_rate: 0,
      srv_rerror_rate: 0,
      same_srv_rate: 1,
      diff_srv_rate: 0,
      srv_diff_host_rate: 0,
      dst_host_count: 1,
      dst_host_srv_count: 1,
      dst_host_same_srv_rate: 1,
      dst_host_diff_srv_rate: 0,
      dst_host_same_src_port_rate: 1,
      dst_host_srv_diff_host_rate: 0,
      dst_host_serror_rate: 0,
      dst_host_srv_serror_rate: 0,
      dst_host_rerror_rate: 0,
      dst_host_srv_rerror_rate: 0,
    };
  }

  private handleStatsMessage(stats: CaptureStats): void {
    this.notifyStatsListeners(stats);
  }

  private handleInterfacesMessage(interfaces: NetworkInterface[]): void {
    this.notifyInterfaceListeners(interfaces);
  }

  // Méthodes de contrôle de capture
  async startCapture(interfaceName?: string, filter?: string): Promise<void> {
    if (this.websocket?.readyState !== WebSocket.OPEN) {
      throw new Error('Connexion WebSocket non établie');
    }

    const command = {
      type: 'start_capture',
      interface: interfaceName || null,
      filter: filter || ''
    };

    console.log('🎯 Démarrage de la capture:', command);
    this.websocket.send(JSON.stringify(command));
  }

  async stopCapture(): Promise<void> {
    if (this.websocket?.readyState !== WebSocket.OPEN) {
      throw new Error('Connexion WebSocket non établie');
    }

    console.log('⏹️ Arrêt de la capture');
    this.websocket.send(JSON.stringify({ type: 'stop_capture' }));
  }

  // Méthodes de gestion des listeners
  addPacketListener(callback: (packet: NetworkPacket) => void): void {
    this.listeners.push(callback);
  }

  removePacketListener(callback: (packet: NetworkPacket) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  addStatsListener(callback: (stats: CaptureStats) => void): void {
    this.statsListeners.push(callback);
  }

  removeStatsListener(callback: (stats: CaptureStats) => void): void {
    this.statsListeners = this.statsListeners.filter(listener => listener !== callback);
  }

  addInterfaceListener(callback: (interfaces: NetworkInterface[]) => void): void {
    this.interfaceListeners.push(callback);
  }

  removeInterfaceListener(callback: (interfaces: NetworkInterface[]) => void): void {
    this.interfaceListeners = this.interfaceListeners.filter(listener => listener !== callback);
  }

  addConnectionListener(callback: (status: string) => void): void {
    this.connectionListeners.push(callback);
  }

  removeConnectionListener(callback: (status: string) => void): void {
    this.connectionListeners = this.connectionListeners.filter(listener => listener !== callback);
  }

  private notifyPacketListeners(packet: NetworkPacket): void {
    this.listeners.forEach(listener => {
      try {
        listener(packet);
      } catch (error) {
        console.error('Erreur dans un listener de paquet:', error);
      }
    });
  }

  private notifyStatsListeners(stats: CaptureStats): void {
    this.statsListeners.forEach(listener => {
      try {
        listener(stats);
      } catch (error) {
        console.error('Erreur dans un listener de stats:', error);
      }
    });
  }

  private notifyInterfaceListeners(interfaces: NetworkInterface[]): void {
    this.interfaceListeners.forEach(listener => {
      try {
        listener(interfaces);
      } catch (error) {
        console.error('Erreur dans un listener d\'interfaces:', error);
      }
    });
  }

  // Méthodes d'état
  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.websocket?.readyState === WebSocket.OPEN;
  }

  getStats() {
    return {
      connectionStatus: this.connectionStatus,
      isConnected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      listenersCount: this.listeners.length
    };
  }

  // Nettoyage
  destroy(): void {
    this.disconnect();
    this.listeners = [];
    this.statsListeners = [];
    this.interfaceListeners = [];
    this.connectionListeners = [];
  }
}

// Instance singleton pour l'application
export const realPacketCaptureService = new RealPacketCaptureService();