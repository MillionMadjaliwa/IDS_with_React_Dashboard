/**
 * Service de simulation automatique quand le service Python n'est pas disponible
 * Génère des données réalistes pour le développement et les démonstrations
 */

import { NetworkPacket, CaptureStats, NetworkInterface } from './real-packet-capture-service';

export class FallbackSimulationService {
  private listeners: ((packet: NetworkPacket) => void)[] = [];
  private statsListeners: ((stats: CaptureStats) => void)[] = [];
  private interfaceListeners: ((interfaces: NetworkInterface[]) => void)[] = [];
  private connectionListeners: ((status: string) => void)[] = [];

  private isRunning = false;
  private simulationInterval: NodeJS.Timeout | null = null;
  private statsInterval: NodeJS.Timeout | null = null;
  
  private packetCount = 0;
  private anomaliesCount = 0;
  private startTime = Date.now();

  // Données de simulation réalistes
  private readonly sourceIps = [
    '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103',
    '10.0.0.50', '10.0.0.51', '172.16.1.20', '172.16.1.21',
    '203.0.113.5', '198.51.100.10' // IPs externes pour simulation
  ];

  private readonly destinationIps = [
    '192.168.1.1', '8.8.8.8', '1.1.1.1', '172.217.16.142',
    '52.86.25.205', '13.107.42.14', '104.16.249.249',
    '192.168.1.254', '10.0.0.1'
  ];

  private readonly protocols: NetworkPacket['protocol'][] = [
    'TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'SSH', 'FTP'
  ];

  private readonly threatLevels: Array<{level: NetworkPacket['threat_level'], weight: number}> = [
    { level: 'Informationnel', weight: 70 },
    { level: 'Faible', weight: 15 },
    { level: 'Moyen', weight: 10 },
    { level: 'Élevé', weight: 4 },
    { level: 'Critique', weight: 1 }
  ];

  start(): void {
    if (this.isRunning) return;

    console.log('🤖 Mode simulation activé - Données réalistes générées pour démonstration');
    console.log('💡 Pour la capture réelle, démarrez le service Python avec: sudo python3 start_sentinel.py');
    this.isRunning = true;
    this.startTime = Date.now();

    // Notifier le statut de connexion
    this.notifyConnectionListeners('connected');

    // Envoyer la liste des interfaces simulées
    this.sendSimulatedInterfaces();

    // Générer quelques paquets immédiatement
    for (let i = 0; i < 5; i++) {
      setTimeout(() => this.generatePacket(), i * 200);
    }

    // Démarrer la génération de paquets
    this.simulationInterval = setInterval(() => {
      this.generatePacket();
    }, this.getRandomInterval(500, 3000)); // Entre 500ms et 3s

    // Envoyer les stats périodiquement
    this.statsInterval = setInterval(() => {
      this.sendStats();
    }, 2000); // Toutes les 2 secondes

    // Envoyer les stats initiales immédiatement
    setTimeout(() => this.sendStats(), 100);
  }

  stop(): void {
    if (!this.isRunning) return;

    console.log('🛑 Arrêt du service de simulation');
    this.isRunning = false;

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    this.notifyConnectionListeners('disconnected');
  }

  private generatePacket(): void {
    const sourceIp = this.getRandomElement(this.sourceIps);
    const destinationIp = this.getRandomElement(this.destinationIps);
    const protocol = this.getRandomElement(this.protocols);
    const threatLevel = this.getWeightedThreatLevel();
    const isAnomaly = threatLevel !== 'Informationnel' && Math.random() < 0.3;

    const packet: NetworkPacket = {
      id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      sourceIp,
      destinationIp,
      sourcePort: this.getRandomPort(protocol),
      destinationPort: this.getRandomDestinationPort(protocol),
      protocol,
      size: this.getRandomPacketSize(protocol),
      flags: this.getRandomFlags(protocol),
      payloadPreview: this.generatePayloadPreview(protocol),
      threat_level: threatLevel,
      anomaly_score: this.getAnomalyScore(threatLevel),
      prediction: isAnomaly ? 'Anomalie' : 'Normal',
      features: this.generateRandomFeatures()
    };

    this.packetCount++;
    if (isAnomaly) {
      this.anomaliesCount++;
    }

    this.notifyPacketListeners(packet);
  }

  private getWeightedThreatLevel(): NetworkPacket['threat_level'] {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const threat of this.threatLevels) {
      cumulative += threat.weight;
      if (random <= cumulative) {
        return threat.level;
      }
    }

    return 'Informationnel';
  }

  private getAnomalyScore(threatLevel: NetworkPacket['threat_level']): number {
    const baseScores = {
      'Informationnel': 0.05,
      'Faible': 0.25,
      'Moyen': 0.5,
      'Élevé': 0.75,
      'Critique': 0.9
    };

    const baseScore = baseScores[threatLevel];
    const variation = (Math.random() - 0.5) * 0.2; // ±10%
    return Math.max(0, Math.min(1, baseScore + variation));
  }

  private getRandomPort(protocol: NetworkPacket['protocol']): number {
    // Ports dynamiques/privés principalement
    return Math.floor(Math.random() * (65535 - 1024)) + 1024;
  }

  private getRandomDestinationPort(protocol: NetworkPacket['protocol']): number {
    const commonPorts = {
      'HTTP': [80, 8080, 3000, 8000],
      'HTTPS': [443, 8443],
      'DNS': [53],
      'SSH': [22, 2222],
      'FTP': [21, 2121],
      'TCP': [80, 443, 22, 25, 110, 143, 993, 995],
      'UDP': [53, 67, 68, 123, 161, 514]
    };

    const ports = commonPorts[protocol] || [80, 443, 22, 53];
    return this.getRandomElement(ports);
  }

  private getRandomPacketSize(protocol: NetworkPacket['protocol']): number {
    const sizeRanges = {
      'DNS': [64, 512],
      'HTTP': [200, 1500],
      'HTTPS': [200, 1500],
      'SSH': [64, 1500],
      'FTP': [64, 1500],
      'TCP': [64, 1500],
      'UDP': [64, 1024]
    };

    const [min, max] = sizeRanges[protocol] || [64, 1500];
    return Math.floor(Math.random() * (max - min)) + min;
  }

  private getRandomFlags(protocol: NetworkPacket['protocol']): string[] {
    if (protocol !== 'TCP') return [];

    const flagSets = [
      ['SYN'],
      ['SYN', 'ACK'],
      ['ACK'],
      ['FIN', 'ACK'],
      ['RST'],
      ['PSH', 'ACK'],
      []
    ];

    return this.getRandomElement(flagSets);
  }

  private generatePayloadPreview(protocol: NetworkPacket['protocol']): string {
    const previews = {
      'HTTP': [
        'GET /api/users HTTP/1.1',
        'POST /login HTTP/1.1',
        'GET /static/css/main.css HTTP/1.1',
        'GET /favicon.ico HTTP/1.1'
      ],
      'HTTPS': [
        'TLS Handshake, Client Hello',
        'TLS Application Data',
        'TLS Change Cipher Spec',
        'TLS Alert'
      ],
      'DNS': [
        'Query: google.com A',
        'Query: facebook.com AAAA',
        'Response: 142.250.191.14',
        'Query: cloudflare.com MX'
      ],
      'SSH': [
        'SSH-2.0-OpenSSH_8.9',
        'Key Exchange Init',
        'Encrypted packet',
        'Authentication request'
      ],
      'FTP': [
        '220 Welcome to FTP server',
        'USER anonymous',
        'PASS guest@',
        'LIST -la'
      ]
    };

    const protocolPreviews = previews[protocol] || ['Binary data...'];
    return this.getRandomElement(protocolPreviews);
  }

  private generateRandomFeatures(): NetworkPacket['features'] {
    return {
      duration: Math.random() * 300, // 0-300 secondes
      src_bytes: Math.floor(Math.random() * 10000),
      dst_bytes: Math.floor(Math.random() * 10000),
      land: Math.random() < 0.01 ? 1 : 0, // 1% de land attacks
      wrong_fragment: Math.random() < 0.02 ? 1 : 0,
      urgent: Math.random() < 0.001 ? 1 : 0,
      hot: Math.floor(Math.random() * 5),
      num_failed_logins: Math.floor(Math.random() * 3),
      logged_in: Math.random() < 0.8 ? 1 : 0,
      num_compromised: Math.floor(Math.random() * 2),
      root_shell: Math.random() < 0.05 ? 1 : 0,
      su_attempted: Math.random() < 0.1 ? 1 : 0,
      num_root: Math.floor(Math.random() * 3),
      num_file_creations: Math.floor(Math.random() * 10),
      num_shells: Math.floor(Math.random() * 2),
      num_access_files: Math.floor(Math.random() * 20),
      num_outbound_cmds: Math.floor(Math.random() * 5),
      is_host_login: Math.random() < 0.3 ? 1 : 0,
      is_guest_login: Math.random() < 0.1 ? 1 : 0,
      count: Math.floor(Math.random() * 100) + 1,
      srv_count: Math.floor(Math.random() * 50) + 1,
      serror_rate: Math.random() * 0.1,
      srv_serror_rate: Math.random() * 0.1,
      rerror_rate: Math.random() * 0.05,
      srv_rerror_rate: Math.random() * 0.05,
      same_srv_rate: Math.random(),
      diff_srv_rate: Math.random(),
      srv_diff_host_rate: Math.random(),
      dst_host_count: Math.floor(Math.random() * 200) + 1,
      dst_host_srv_count: Math.floor(Math.random() * 50) + 1,
      dst_host_same_srv_rate: Math.random(),
      dst_host_diff_srv_rate: Math.random(),
      dst_host_same_src_port_rate: Math.random(),
      dst_host_srv_diff_host_rate: Math.random(),
      dst_host_serror_rate: Math.random() * 0.1,
      dst_host_srv_serror_rate: Math.random() * 0.1,
      dst_host_rerror_rate: Math.random() * 0.05,
      dst_host_srv_rerror_rate: Math.random() * 0.05,
    };
  }

  private sendSimulatedInterfaces(): void {
    const interfaces: NetworkInterface[] = [
      { name: 'eth0', ip: '192.168.1.100', status: 'active' },
      { name: 'wlan0', ip: '192.168.1.101', status: 'active' },
      { name: 'lo', ip: '127.0.0.1', status: 'active' },
      { name: 'docker0', ip: '172.17.0.1', status: 'inactive' }
    ];

    this.notifyInterfaceListeners(interfaces);
  }

  private sendStats(): void {
    const currentTime = Date.now();
    const elapsed = (currentTime - this.startTime) / 1000; // en secondes
    const pps = elapsed > 0 ? Math.round(this.packetCount / elapsed) : 0;

    const stats: CaptureStats = {
      total_packets: this.packetCount,
      packets_per_second: pps,
      anomalies_detected: this.anomaliesCount,
      is_capturing: this.isRunning,
      connected_clients: 1,
      queue_size: Math.floor(Math.random() * 50)
    };

    this.notifyStatsListeners(stats);
  }

  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private getRandomInterval(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  // Méthodes de gestion des listeners (identiques au service principal)
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

  private notifyConnectionListeners(status: string): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Erreur dans un listener de connexion:', error);
      }
    });
  }

  destroy(): void {
    this.stop();
    this.listeners = [];
    this.statsListeners = [];
    this.interfaceListeners = [];
    this.connectionListeners = [];
  }
}