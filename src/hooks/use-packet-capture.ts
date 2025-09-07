import { useState, useEffect, useCallback, useRef } from 'react';
import { packetCaptureService, NetworkPacket } from '../lib/packet-capture-service';

export interface PacketCaptureStats {
  totalPackets: number;
  packetsPerSecond: number;
  anomaliesDetected: number;
  averageAnomalyScore: number;
  protocolDistribution: Record<string, number>;
  threatLevelDistribution: Record<string, number>;
}

export function usePacketCapture(maxPackets: number = 1000) {
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stats, setStats] = useState<PacketCaptureStats>({
    totalPackets: 0,
    packetsPerSecond: 0,
    anomaliesDetected: 0,
    averageAnomalyScore: 0,
    protocolDistribution: {},
    threatLevelDistribution: {}
  });

  const packetsRef = useRef<NetworkPacket[]>([]);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPacketCountRef = useRef(0);

  // Callback pour recevoir les nouveaux paquets
  const handleNewPacket = useCallback((packet: NetworkPacket) => {
    packetsRef.current = [packet, ...packetsRef.current.slice(0, maxPackets - 1)];
    setPackets([...packetsRef.current]);
  }, [maxPackets]);

  // Calcul des statistiques en temps réel
  const updateStats = useCallback(() => {
    const currentPackets = packetsRef.current;
    const currentPacketCount = currentPackets.length;
    
    // Calcul des paquets par seconde
    const packetsPerSecond = Math.max(0, currentPacketCount - lastPacketCountRef.current);
    lastPacketCountRef.current = currentPacketCount;

    // Calcul des anomalies
    const anomalies = currentPackets.filter(p => p.prediction === 'Anomalie');
    const anomaliesDetected = anomalies.length;
    
    // Score d'anomalie moyen
    const averageAnomalyScore = currentPackets.length > 0 ? 
      currentPackets.reduce((sum, p) => sum + p.anomaly_score, 0) / currentPackets.length : 0;

    // Distribution des protocoles
    const protocolDistribution: Record<string, number> = {};
    currentPackets.forEach(packet => {
      protocolDistribution[packet.protocol] = (protocolDistribution[packet.protocol] || 0) + 1;
    });

    // Distribution des niveaux de menace
    const threatLevelDistribution: Record<string, number> = {};
    currentPackets.forEach(packet => {
      threatLevelDistribution[packet.threat_level] = (threatLevelDistribution[packet.threat_level] || 0) + 1;
    });

    setStats({
      totalPackets: packetCaptureService.getStats().totalPackets,
      packetsPerSecond,
      anomaliesDetected,
      averageAnomalyScore,
      protocolDistribution,
      threatLevelDistribution
    });
  }, []);

  // Démarrer la capture
  const startCapture = useCallback(() => {
    if (isCapturing) return;
    
    packetCaptureService.addListener(handleNewPacket);
    packetCaptureService.startCapture();
    setIsCapturing(true);

    // Mettre à jour les statistiques toutes les secondes
    statsIntervalRef.current = setInterval(updateStats, 1000);
  }, [isCapturing, handleNewPacket, updateStats]);

  // Arrêter la capture
  const stopCapture = useCallback(() => {
    if (!isCapturing) return;
    
    packetCaptureService.removeListener(handleNewPacket);
    packetCaptureService.stopCapture();
    setIsCapturing(false);

    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
  }, [isCapturing, handleNewPacket]);

  // Vider la liste des paquets
  const clearPackets = useCallback(() => {
    packetsRef.current = [];
    setPackets([]);
    lastPacketCountRef.current = 0;
  }, []);

  // Nettoyer lors du démontage du composant
  useEffect(() => {
    return () => {
      stopCapture();
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [stopCapture]);

  // Mettre à jour les statistiques au changement des paquets
  useEffect(() => {
    updateStats();
  }, [packets, updateStats]);

  return {
    packets,
    isCapturing,
    stats,
    startCapture,
    stopCapture,
    clearPackets,
    // Filtrage et recherche
    getPacketsByProtocol: useCallback((protocol: string) => 
      packets.filter(p => p.protocol === protocol), [packets]),
    getAnomalousPackets: useCallback(() => 
      packets.filter(p => p.prediction === 'Anomalie'), [packets]),
    getPacketsByThreatLevel: useCallback((level: string) => 
      packets.filter(p => p.threat_level === level), [packets]),
    searchPackets: useCallback((query: string) => 
      packets.filter(p => 
        p.sourceIp.includes(query) || 
        p.destinationIp.includes(query) ||
        p.payloadPreview.toLowerCase().includes(query.toLowerCase())
      ), [packets])
  };
}