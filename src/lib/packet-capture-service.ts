/**
 * Service de simulation de capture de paquets réseau
 * Génère des données réalistes pour le réseau 192.168.156.0/24
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

class PacketCaptureService {
  private isCapturing = false;
  private captureInterval: NodeJS.Timeout | null = null;
  private listeners: ((packet: NetworkPacket) => void)[] = [];
  private packetCount = 0;

  // Adresses IP communes dans le réseau 192.168.156.0/24
  private readonly commonIPs = [
    '192.168.156.1',   // Routeur/Gateway
    '192.168.156.10',  // Serveur DNS
    '192.168.156.15',  // Serveur Web
    '192.168.156.20',  // Serveur de fichiers
    '192.168.156.25',  // Serveur de base de données
    '192.168.156.50',  // Poste de travail administrateur
    '192.168.156.100', // Postes utilisateurs
    '192.168.156.101',
    '192.168.156.102',
    '192.168.156.103',
    '192.168.156.104',
    '192.168.156.105',
  ];

  // Ports communs pour différents services
  private readonly commonPorts = {
    HTTP: [80, 8080, 8000],
    HTTPS: [443, 8443],
    DNS: [53],
    SSH: [22],
    FTP: [21, 20],
    TCP: [25, 110, 143, 993, 995, 3389],
    UDP: [123, 161, 162, 500]
  };

  // Charges utiles réalistes
  private readonly payloadSamples = [
    'GET /api/users HTTP/1.1',
    'POST /login HTTP/1.1',
    'DNS Query: www.example.com',
    'SSH-2.0-OpenSSH_8.0',
    'FTP: USER anonymous',
    'ICMP Echo Request',
    'TLS Handshake',
    'HTTP/1.1 200 OK',
    'SQL Query: SELECT * FROM users',
    'File Transfer: document.pdf'
  ];

  // Patterns d'anomalies pour simulation
  private readonly anomalyPatterns = [
    {
      pattern: 'port_scan',
      description: 'Scan de ports détecté',
      probability: 0.05,
      features: { count: 100, srv_count: 50, serror_rate: 0.9 }
    },
    {
      pattern: 'dos_attack',
      description: 'Attaque par déni de service',
      probability: 0.02,
      features: { count: 500, same_srv_rate: 1.0, srv_count: 1 }
    },
    {
      pattern: 'brute_force',
      description: 'Attaque par force brute',
      probability: 0.03,
      features: { num_failed_logins: 10, hot: 5, logged_in: 0 }
    },
    {
      pattern: 'unusual_traffic',
      description: 'Trafic inhabituel détecté',
      probability: 0.08,
      features: { dst_host_count: 200, dst_host_diff_srv_rate: 0.8 }
    }
  ];

  startCapture(): void {
    if (this.isCapturing) return;
    
    this.isCapturing = true;
    console.log('🎯 Début de la capture de paquets réseau...');
    
    // Simulation de capture à intervalles variables (plus réaliste)
    const scheduleNextPacket = () => {
      if (!this.isCapturing) return;
      
      const delay = Math.random() * 100 + 10; // 10-110ms entre les paquets
      
      setTimeout(() => {
        this.generatePacket();
        scheduleNextPacket();
      }, delay);
    };
    
    scheduleNextPacket();
  }

  stopCapture(): void {
    this.isCapturing = false;
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    console.log('⏹️ Arrêt de la capture de paquets réseau');
  }

  addListener(callback: (packet: NetworkPacket) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (packet: NetworkPacket) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private generatePacket(): void {
    const packet = this.createRealisticPacket();
    this.notifyListeners(packet);
  }

  private createRealisticPacket(): NetworkPacket {
    const protocol = this.getRandomProtocol();
    const isAnomaly = Math.random() < 0.1; // 10% d'anomalies
    const anomalyPattern = isAnomaly ? 
      this.anomalyPatterns[Math.floor(Math.random() * this.anomalyPatterns.length)] : null;

    const sourceIp = this.getRandomIP();
    const destinationIp = this.getRandomIP();
    const ports = this.getPortsForProtocol(protocol);
    const sourcePort = Math.floor(Math.random() * 65535) + 1;
    const destinationPort = ports[Math.floor(Math.random() * ports.length)];

    // Génération des caractéristiques pour le modèle RandomForest
    const baseFeatures = this.generateBaseFeatures();
    const features = anomalyPattern ? 
      { ...baseFeatures, ...anomalyPattern.features } : baseFeatures;

    // Calcul du score d'anomalie (simulation du modèle RandomForest)
    const anomalyScore = this.calculateAnomalyScore(features, isAnomaly);
    const prediction = anomalyScore > 0.7 ? 'Anomalie' : 'Normal';
    const threatLevel = this.getThreatLevel(anomalyScore);

    this.packetCount++;

    return {
      id: `pkt_${this.packetCount}_${Date.now()}`,
      timestamp: new Date(),
      sourceIp,
      destinationIp,
      sourcePort,
      destinationPort,
      protocol,
      size: Math.floor(Math.random() * 1500) + 64, // Taille réaliste des paquets
      flags: this.generateFlags(protocol),
      payloadPreview: this.getRandomPayload(),
      threat_level: threatLevel,
      anomaly_score: anomalyScore,
      prediction,
      features
    };
  }

  private getRandomProtocol(): NetworkPacket['protocol'] {
    const protocols: NetworkPacket['protocol'][] = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'SSH', 'FTP', 'ICMP'];
    const weights = [25, 20, 20, 15, 10, 5, 3, 2]; // Probabilités pondérées
    
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (let i = 0; i < protocols.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return protocols[i];
      }
    }
    
    return 'TCP';
  }

  private getRandomIP(): string {
    // 80% du trafic utilise des IPs communes, 20% aléatoires
    if (Math.random() < 0.8) {
      return this.commonIPs[Math.floor(Math.random() * this.commonIPs.length)];
    } else {
      const lastOctet = Math.floor(Math.random() * 254) + 1;
      return `192.168.156.${lastOctet}`;
    }
  }

  private getPortsForProtocol(protocol: NetworkPacket['protocol']): number[] {
    switch (protocol) {
      case 'HTTP': return this.commonPorts.HTTP;
      case 'HTTPS': return this.commonPorts.HTTPS;
      case 'DNS': return this.commonPorts.DNS;
      case 'SSH': return this.commonPorts.SSH;
      case 'FTP': return this.commonPorts.FTP;
      case 'UDP': return this.commonPorts.UDP;
      default: return this.commonPorts.TCP;
    }
  }

  private generateFlags(protocol: NetworkPacket['protocol']): string[] {
    const allFlags = ['SYN', 'ACK', 'FIN', 'RST', 'PSH', 'URG'];
    const flags: string[] = [];
    
    if (protocol === 'TCP') {
      // Simulation réaliste des flags TCP
      if (Math.random() < 0.3) flags.push('SYN');
      if (Math.random() < 0.7) flags.push('ACK');
      if (Math.random() < 0.1) flags.push('FIN');
      if (Math.random() < 0.05) flags.push('RST');
      if (Math.random() < 0.2) flags.push('PSH');
    }
    
    return flags;
  }

  private getRandomPayload(): string {
    return this.payloadSamples[Math.floor(Math.random() * this.payloadSamples.length)];
  }

  private generateBaseFeatures(): NetworkPacket['features'] {
    return {
      duration: Math.random() * 1000,
      src_bytes: Math.floor(Math.random() * 10000),
      dst_bytes: Math.floor(Math.random() * 10000),
      land: Math.random() < 0.01 ? 1 : 0,
      wrong_fragment: Math.random() < 0.01 ? 1 : 0,
      urgent: Math.random() < 0.01 ? 1 : 0,
      hot: Math.floor(Math.random() * 5),
      num_failed_logins: Math.floor(Math.random() * 3),
      logged_in: Math.random() < 0.7 ? 1 : 0,
      num_compromised: Math.floor(Math.random() * 2),
      root_shell: Math.random() < 0.05 ? 1 : 0,
      su_attempted: Math.random() < 0.02 ? 1 : 0,
      num_root: Math.floor(Math.random() * 2),
      num_file_creations: Math.floor(Math.random() * 10),
      num_shells: Math.floor(Math.random() * 3),
      num_access_files: Math.floor(Math.random() * 5),
      num_outbound_cmds: Math.floor(Math.random() * 3),
      is_host_login: Math.random() < 0.3 ? 1 : 0,
      is_guest_login: Math.random() < 0.1 ? 1 : 0,
      count: Math.floor(Math.random() * 100) + 1,
      srv_count: Math.floor(Math.random() * 50) + 1,
      serror_rate: Math.random() * 0.1,
      srv_serror_rate: Math.random() * 0.1,
      rerror_rate: Math.random() * 0.1,
      srv_rerror_rate: Math.random() * 0.1,
      same_srv_rate: Math.random(),
      diff_srv_rate: Math.random(),
      srv_diff_host_rate: Math.random(),
      dst_host_count: Math.floor(Math.random() * 255) + 1,
      dst_host_srv_count: Math.floor(Math.random() * 50) + 1,
      dst_host_same_srv_rate: Math.random(),
      dst_host_diff_srv_rate: Math.random(),
      dst_host_same_src_port_rate: Math.random(),
      dst_host_srv_diff_host_rate: Math.random(),
      dst_host_serror_rate: Math.random() * 0.1,
      dst_host_srv_serror_rate: Math.random() * 0.1,
      dst_host_rerror_rate: Math.random() * 0.1,
      dst_host_srv_rerror_rate: Math.random() * 0.1,
    };
  }

  private calculateAnomalyScore(features: NetworkPacket['features'], forceAnomaly: boolean): number {
    if (forceAnomaly) {
      return Math.random() * 0.3 + 0.7; // 0.7-1.0 pour les anomalies
    }

    // Simulation simplifiée d'un score RandomForest
    let score = 0;
    
    // Facteurs qui augmentent le score d'anomalie
    if (features.serror_rate > 0.5) score += 0.3;
    if (features.count > 200) score += 0.2;
    if (features.num_failed_logins > 5) score += 0.3;
    if (features.dst_host_count > 100) score += 0.2;
    if (features.root_shell > 0) score += 0.4;
    
    // Ajout de bruit aléatoire
    score += Math.random() * 0.2;
    
    return Math.min(score, 1.0);
  }

  private getThreatLevel(anomalyScore: number): NetworkPacket['threat_level'] {
    if (anomalyScore >= 0.9) return 'Critique';
    if (anomalyScore >= 0.7) return 'Élevé';
    if (anomalyScore >= 0.5) return 'Moyen';
    if (anomalyScore >= 0.3) return 'Faible';
    return 'Informationnel';
  }

  private notifyListeners(packet: NetworkPacket): void {
    this.listeners.forEach(listener => listener(packet));
  }

  // Méthodes pour les statistiques
  getStats() {
    return {
      isCapturing: this.isCapturing,
      totalPackets: this.packetCount,
      listenersCount: this.listeners.length
    };
  }

  reset(): void {
    this.stopCapture();
    this.packetCount = 0;
    this.listeners = [];
  }
}

// Instance singleton
export const packetCaptureService = new PacketCaptureService();