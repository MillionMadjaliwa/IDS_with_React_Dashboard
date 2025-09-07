import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  realPacketCaptureService, 
  NetworkPacket, 
  NetworkInterface, 
  CaptureStats 
} from '../lib/real-packet-capture-service';
import { FallbackSimulationService } from '../lib/fallback-simulation-service';

export interface PacketCaptureStats {
  totalPackets: number;
  packetsPerSecond: number;
  anomaliesDetected: number;
  averageAnomalyScore: number;
  protocolDistribution: Record<string, number>;
  threatLevelDistribution: Record<string, number>;
  isCapturing: boolean;
  connectionStatus: string;
  connectedClients: number;
  queueSize: number;
}

export interface ConnectionConfig {
  url?: string;
  autoConnect?: boolean;
  autoReconnect?: boolean;
}

export function useRealPacketCapture(
  maxPackets: number = 1000,
  config?: ConnectionConfig
) {
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('connected'); // Démarrer en connecté (simulation)
  const [isCapturing, setIsCapturing] = useState(false);
  const [usingFallback, setUsingFallback] = useState(true); // Démarrer directement en simulation
  const [stats, setStats] = useState<PacketCaptureStats>({
    totalPackets: 0,
    packetsPerSecond: 0,
    anomaliesDetected: 0,
    averageAnomalyScore: 0,
    protocolDistribution: {},
    threatLevelDistribution: {},
    isCapturing: false,
    connectionStatus: 'connected',
    connectedClients: 1,
    queueSize: 0
  });

  const packetsRef = useRef<NetworkPacket[]>([]);
  const captureStatsRef = useRef<CaptureStats | null>(null);
  const fallbackService = useRef<FallbackSimulationService | null>(null);

  // Callbacks pour gérer les événements du service
  const handleNewPacket = useCallback((packet: NetworkPacket) => {
    packetsRef.current = [packet, ...packetsRef.current.slice(0, maxPackets - 1)];
    setPackets([...packetsRef.current]);
  }, [maxPackets]);

  const handleStatsUpdate = useCallback((captureStats: CaptureStats) => {
    captureStatsRef.current = captureStats;
    setIsCapturing(captureStats.is_capturing);
    
    // Calculer les statistiques dérivées
    const currentPackets = packetsRef.current;
    const anomalies = currentPackets.filter(p => p.prediction === 'Anomalie');
    const averageScore = currentPackets.length > 0 ? 
      currentPackets.reduce((sum, p) => sum + p.anomaly_score, 0) / currentPackets.length : 0;

    // Distribution des protocoles
    const protocolDist: Record<string, number> = {};
    currentPackets.forEach(packet => {
      protocolDist[packet.protocol] = (protocolDist[packet.protocol] || 0) + 1;
    });

    // Distribution des niveaux de menace
    const threatDist: Record<string, number> = {};
    currentPackets.forEach(packet => {
      threatDist[packet.threat_level] = (threatDist[packet.threat_level] || 0) + 1;
    });

    setStats({
      totalPackets: captureStats.total_packets,
      packetsPerSecond: captureStats.packets_per_second,
      anomaliesDetected: captureStats.anomalies_detected,
      averageAnomalyScore: averageScore,
      protocolDistribution: protocolDist,
      threatLevelDistribution: threatDist,
      isCapturing: captureStats.is_capturing,
      connectionStatus: connectionStatus,
      connectedClients: captureStats.connected_clients,
      queueSize: captureStats.queue_size
    });
  }, [connectionStatus]);

  const handleInterfacesUpdate = useCallback((networkInterfaces: NetworkInterface[]) => {
    setInterfaces(networkInterfaces);
  }, []);

  const handleConnectionStatusChange = useCallback((status: string) => {
    setConnectionStatus(status);
    console.log(`📡 Statut de connexion: ${status}`);
  }, []);

  // Initialiser le service de simulation
  const initializeFallback = useCallback(() => {
    if (!fallbackService.current) {
      fallbackService.current = new FallbackSimulationService();
      
      // Configurer les listeners pour le service de simulation
      fallbackService.current.addPacketListener(handleNewPacket);
      fallbackService.current.addStatsListener(handleStatsUpdate);
      fallbackService.current.addInterfaceListener(handleInterfacesUpdate);
      fallbackService.current.addConnectionListener(handleConnectionStatusChange);
    }
    
    fallbackService.current.start();
    setUsingFallback(true);
    setConnectionStatus('connected');
  }, [handleNewPacket, handleStatsUpdate, handleInterfacesUpdate, handleConnectionStatusChange]);

  // Connexion au service Python (optionnelle)
  const connectToPython = useCallback(async (url?: string) => {
    try {
      setConnectionStatus('connecting');
      await realPacketCaptureService.connect(url);
      
      // Si on était en mode simulation, l'arrêter
      if (fallbackService.current) {
        fallbackService.current.stop();
      }
      
      setUsingFallback(false);
      setConnectionStatus('connected');
      console.log('✅ Connexion au service Python réussie');
      return true;
    } catch (error) {
      console.log('⚠️ Service Python non disponible');
      
      // Revenir au mode simulation
      if (!usingFallback) {
        initializeFallback();
      }
      return false;
    }
  }, [initializeFallback, usingFallback]);

  // Méthode de connexion générale (démarre en simulation par défaut)
  const connect = useCallback(async (url?: string) => {
    // Par défaut, on démarre en mode simulation
    if (!usingFallback) {
      initializeFallback();
    }
    return true;
  }, [initializeFallback, usingFallback]);

  const disconnect = useCallback(() => {
    if (usingFallback && fallbackService.current) {
      fallbackService.current.stop();
    } else {
      realPacketCaptureService.disconnect();
    }
    setUsingFallback(false);
  }, [usingFallback]);

  // Contrôle de la capture
  const startCapture = useCallback(async (interfaceName?: string, filter?: string) => {
    try {
      if (usingFallback && fallbackService.current) {
        // Le service de simulation démarre automatiquement
        return true;
      } else {
        if (!realPacketCaptureService.isConnected()) {
          throw new Error('Service non connecté');
        }
        await realPacketCaptureService.startCapture(interfaceName, filter);
        return true;
      }
    } catch (error) {
      console.error('Erreur lors du démarrage de la capture:', error);
      return false;
    }
  }, [usingFallback]);

  const stopCapture = useCallback(async () => {
    try {
      if (usingFallback && fallbackService.current) {
        fallbackService.current.stop();
        return true;
      } else {
        if (!realPacketCaptureService.isConnected()) {
          throw new Error('Service non connecté');
        }
        await realPacketCaptureService.stopCapture();
        return true;
      }
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de la capture:', error);
      return false;
    }
  }, [usingFallback]);

  // Utilitaires
  const clearPackets = useCallback(() => {
    packetsRef.current = [];
    setPackets([]);
  }, []);

  const getPacketsByProtocol = useCallback((protocol: string) => 
    packets.filter(p => p.protocol === protocol), [packets]);

  const getAnomalousPackets = useCallback(() => 
    packets.filter(p => p.prediction === 'Anomalie'), [packets]);

  const getPacketsByThreatLevel = useCallback((level: string) => 
    packets.filter(p => p.threat_level === level), [packets]);

  const searchPackets = useCallback((query: string) => 
    packets.filter(p => 
      p.sourceIp.includes(query) || 
      p.destinationIp.includes(query) ||
      p.payloadPreview.toLowerCase().includes(query.toLowerCase())
    ), [packets]);

  // Configuration des listeners au montage
  useEffect(() => {
    // Ajouter les listeners pour le service réel
    realPacketCaptureService.addPacketListener(handleNewPacket);
    realPacketCaptureService.addStatsListener(handleStatsUpdate);
    realPacketCaptureService.addInterfaceListener(handleInterfacesUpdate);
    realPacketCaptureService.addConnectionListener(handleConnectionStatusChange);

    // Démarrage automatique en mode simulation
    console.log('🤖 Démarrage en mode simulation - Toutes les fonctionnalités disponibles');
    initializeFallback();

    // Nettoyage au démontage
    return () => {
      realPacketCaptureService.removePacketListener(handleNewPacket);
      realPacketCaptureService.removeStatsListener(handleStatsUpdate);
      realPacketCaptureService.removeInterfaceListener(handleInterfacesUpdate);
      realPacketCaptureService.removeConnectionListener(handleConnectionStatusChange);
      
      if (fallbackService.current) {
        fallbackService.current.destroy();
        fallbackService.current = null;
      }
    };
  }, [
    handleNewPacket,
    handleStatsUpdate,
    handleInterfacesUpdate,
    handleConnectionStatusChange,
    initializeFallback
  ]);

  // Mettre à jour les statistiques quand les paquets changent
  useEffect(() => {
    if (captureStatsRef.current) {
      handleStatsUpdate(captureStatsRef.current);
    }
  }, [packets, handleStatsUpdate]);

  return {
    // État
    packets,
    interfaces,
    stats,
    connectionStatus,
    isCapturing,
    isConnected: usingFallback || realPacketCaptureService.isConnected(),
    usingFallback,

    // Actions de connexion
    connect,
    connectToPython, // Nouvelle méthode pour se connecter spécifiquement au Python
    disconnect,

    // Actions de capture
    startCapture,
    stopCapture,
    clearPackets,

    // Utilitaires de recherche et filtrage
    getPacketsByProtocol,
    getAnomalousPackets,
    getPacketsByThreatLevel,
    searchPackets,

    // Informations de debug
    serviceStats: realPacketCaptureService.getStats()
  };
}