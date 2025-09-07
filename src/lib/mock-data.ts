// Mock data for Sentinel IDS

export interface TrafficEntry {
  id: string;
  timestamp: string;
  srcIp: string;
  srcHost?: string;
  dstIp: string;
  dstHost?: string;
  protocol: "TCP" | "UDP" | "ICMP" | "Other";
  service: "HTTP" | "HTTPS" | "DNS" | "SSH" | "FTP" | "SMTP" | "Other";
  bytesIn: number;
  bytesOut: number;
  flags?: string;
  prediction: "Normal" | "Attack";
  attackProbability: number;
  severity: "informational" | "low" | "medium" | "high" | "critical";
  flows: number;
  riskScore: number;
}

export interface Alert {
  id: string;
  created: string;
  srcIp: string;
  dstIp: string;
  srcPort?: number;
  dstPort?: number;
  protocol: string;
  service: string;
  modelLabel: string;
  probability: number;
  riskScore: number;
  severity: "informational" | "low" | "medium" | "high" | "critical";
  status: "new" | "acknowledged" | "suppressed";
  packetCount: number;
  featureVector?: Record<string, number>;
}

export interface Host {
  id: string;
  hostname: string;
  ip: string;
  mac: string;
  os?: string;
  firstSeen: string;
  lastSeen: string;
  openServices: string[];
  alertCount: number;
  riskTrend: number[];
  isCritical: boolean;
}

// Generate mock LAN traffic data
export function generateTrafficData(count: number = 100): TrafficEntry[] {
  const services = ["HTTP", "HTTPS", "DNS", "SSH", "FTP", "SMTP", "Other"] as const;
  const protocols = ["TCP", "UDP", "ICMP", "Other"] as const;
  const flags = ["SYN", "ACK", "RST", "FIN", "PSH"];
  
  const data: TrafficEntry[] = [];
  
  for (let i = 0; i < count; i++) {
    const now = new Date();
    const timestamp = new Date(now.getTime() - (Math.random() * 300000)).toISOString(); // Last 5 minutes
    
    const srcIp = `192.168.156.${Math.floor(Math.random() * 254) + 1}`;
    const dstIp = Math.random() > 0.7 
      ? `192.168.156.${Math.floor(Math.random() * 254) + 1}` // Internal
      : `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`; // External
    
    const service = services[Math.floor(Math.random() * services.length)];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    
    const attackProbability = Math.random();
    const prediction = attackProbability > 0.8 ? "Attack" : "Normal";
    
    let severity: TrafficEntry["severity"] = "informational";
    if (attackProbability > 0.95) severity = "critical";
    else if (attackProbability > 0.9) severity = "high";
    else if (attackProbability > 0.85) severity = "medium";
    else if (attackProbability > 0.8) severity = "low";
    
    data.push({
      id: `traffic-${i}`,
      timestamp,
      srcIp,
      srcHost: Math.random() > 0.7 ? `workstation-${Math.floor(Math.random() * 50) + 1}` : undefined,
      dstIp,
      dstHost: Math.random() > 0.5 ? `server-${Math.floor(Math.random() * 10) + 1}` : undefined,
      protocol,
      service,
      bytesIn: Math.floor(Math.random() * 10000) + 100,
      bytesOut: Math.floor(Math.random() * 10000) + 100,
      flags: Math.random() > 0.5 ? flags[Math.floor(Math.random() * flags.length)] : undefined,
      prediction,
      attackProbability: Math.round(attackProbability * 1000) / 1000,
      severity,
      flows: Math.floor(Math.random() * 10) + 1,
      riskScore: Math.floor(attackProbability * 100),
    });
  }
  
  return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Generate mock alerts
export function generateAlerts(count: number = 50): Alert[] {
  const services = ["HTTP", "HTTPS", "DNS", "SSH", "FTP", "SMTP", "Other"];
  const protocols = ["TCP", "UDP", "ICMP"];
  const labels = [
    "Port Scan Detected", 
    "Brute Force Attack", 
    "Suspicious Traffic Pattern",
    "Malware Communication",
    "Data Exfiltration Attempt",
    "SQL Injection",
    "XSS Attack"
  ];
  
  const data: Alert[] = [];
  
  for (let i = 0; i < count; i++) {
    const now = new Date();
    const created = new Date(now.getTime() - (Math.random() * 86400000)).toISOString(); // Last 24 hours
    
    const probability = 0.8 + (Math.random() * 0.2); // 0.8-1.0 for alerts
    let severity: Alert["severity"] = "medium";
    if (probability > 0.98) severity = "critical";
    else if (probability > 0.95) severity = "high";
    else if (probability > 0.9) severity = "medium";
    else severity = "low";
    
    data.push({
      id: `alert-${i}`,
      created,
      srcIp: `192.168.156.${Math.floor(Math.random() * 254) + 1}`,
      dstIp: `192.168.156.${Math.floor(Math.random() * 254) + 1}`,
      srcPort: 1024 + Math.floor(Math.random() * 64000),
      dstPort: [80, 443, 22, 21, 25, 53][Math.floor(Math.random() * 6)],
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      service: services[Math.floor(Math.random() * services.length)],
      modelLabel: labels[Math.floor(Math.random() * labels.length)],
      probability: Math.round(probability * 1000) / 1000,
      riskScore: Math.floor(probability * 100),
      severity,
      status: ["new", "acknowledged", "suppressed"][Math.floor(Math.random() * 3)] as any,
      packetCount: Math.floor(Math.random() * 1000) + 10,
      featureVector: {
        "packet_rate": Math.random() * 100,
        "connection_count": Math.random() * 50,
        "bytes_ratio": Math.random(),
        "port_diversity": Math.random() * 10,
        "time_variance": Math.random() * 60,
      }
    });
  }
  
  return data.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
}

// Generate mock hosts
export function generateHosts(count: number = 25): Host[] {
  const osTypes = ["Windows 10", "Windows Server 2019", "Ubuntu 20.04", "macOS", "CentOS 8", "Unknown"];
  const services = [
    ["HTTP", "HTTPS"], 
    ["SSH", "HTTP"], 
    ["DNS", "DHCP"], 
    ["SMTP", "IMAP"], 
    ["FTP", "SSH"],
    ["RDP", "SMB"]
  ];
  
  const data: Host[] = [];
  
  for (let i = 0; i < count; i++) {
    const ip = `192.168.156.${i + 1}`;
    const hostname = `${["workstation", "server", "printer", "router", "switch"][Math.floor(Math.random() * 5)]}-${i + 1}`;
    
    data.push({
      id: `host-${i}`,
      hostname,
      ip,
      mac: `00:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`,
      os: Math.random() > 0.2 ? osTypes[Math.floor(Math.random() * osTypes.length)] : undefined,
      firstSeen: new Date(Date.now() - Math.random() * 2592000000).toISOString(), // Last 30 days
      lastSeen: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Last hour
      openServices: services[Math.floor(Math.random() * services.length)],
      alertCount: Math.floor(Math.random() * 20),
      riskTrend: Array.from({length: 24}, () => Math.floor(Math.random() * 100)),
      isCritical: Math.random() > 0.8,
    });
  }
  
  return data;
}

// Model information
export const modelInfo = {
  name: "RandomForestClassifier",
  version: "2.1.3",
  trainedOn: "Network Traffic Dataset 2024-Q4",
  trainingDate: "2024-12-15T08:30:00Z",
  lastRetrain: "2025-01-15T02:00:00Z",
  features: [
    "packet_rate", "connection_count", "bytes_in_out_ratio", 
    "port_diversity", "time_variance", "protocol_distribution",
    "service_entropy", "flow_duration", "packet_size_variance",
    "connection_frequency"
  ],
  hyperparameters: {
    n_estimators: 200,
    max_depth: 15,
    min_samples_split: 2,
    min_samples_leaf: 1,
    random_state: 42
  },
  metrics: {
    accuracy: 0.947,
    precision: 0.923,
    recall: 0.956,
    f1: 0.939,
    rocAuc: 0.982
  },
  featureImportances: {
    "packet_rate": 0.187,
    "connection_count": 0.165,
    "bytes_in_out_ratio": 0.143,
    "port_diversity": 0.121,
    "time_variance": 0.098,
    "protocol_distribution": 0.087,
    "service_entropy": 0.076,
    "flow_duration": 0.065,
    "packet_size_variance": 0.034,
    "connection_frequency": 0.024
  }
};

// Real-time data simulation
export function generateRealtimeMetrics() {
  return {
    packetsPerMinute: Math.floor(Math.random() * 10000) + 5000,
    uniqueSrcIps: Math.floor(Math.random() * 50) + 25,
    uniqueDstIps: Math.floor(Math.random() * 100) + 50,
    activeServices: Math.floor(Math.random() * 15) + 10,
    packetsPerSecond: Array.from({length: 60}, () => Math.floor(Math.random() * 200) + 50),
    protocolDistribution: {
      TCP: Math.floor(Math.random() * 60) + 40,
      UDP: Math.floor(Math.random() * 30) + 20,
      ICMP: Math.floor(Math.random() * 15) + 5,
      Other: Math.floor(Math.random() * 10) + 2
    },
    serviceDistribution: {
      HTTP: Math.floor(Math.random() * 25) + 15,
      HTTPS: Math.floor(Math.random() * 30) + 20,
      DNS: Math.floor(Math.random() * 20) + 10,
      SSH: Math.floor(Math.random() * 15) + 5,
      FTP: Math.floor(Math.random() * 10) + 2,
      SMTP: Math.floor(Math.random() * 8) + 3,
      Other: Math.floor(Math.random() * 12) + 8
    }
  };
}