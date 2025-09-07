#!/usr/bin/env python3
"""
Script de démarrage simplifié pour Sentinel IDS
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def check_python_version():
    """Vérifie la version de Python"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ requis")
        sys.exit(1)
    print(f"✅ Python {sys.version.split()[0]}")

def check_privileges():
    """Vérifie les privilèges administrateur"""
    try:
        if platform.system() == "Windows":
            import ctypes
            is_admin = ctypes.windll.shell32.IsUserAnAdmin() != 0
        else: # Linux, macOS
            is_admin = os.geteuid() == 0
        
        if not is_admin:
            print("⚠️  Privilèges administrateur requis pour la capture de paquets")
            print("   Relancez avec : sudo python3 start_sentinel.py")
            return False
        else:
            print("✅ Privilèges administrateur détectés")
            return True
    except Exception as e:
        print(f"⚠️  Impossible de vérifier les privilèges: {e}")
        return True



# def create_model_directory():
#     """Crée le répertoire des modèles si nécessaire"""
#     models_dir = Path("models")
#     models_dir.mkdir(exist_ok=True)
#     print(f"📁 Répertoire des modèles: {models_dir.absolute()}")

def main():
    print("""
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           SENTINEL IDS - Démarrage                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    """)
    
    # Vérifications préliminaires
    check_python_version()
    
    if not check_privileges():
        print("\n🔧 Solutions possibles :")
        print("   • Linux/Mac: sudo python3 start_sentinel.py")
        print("   • Windows: Exécuter en tant qu'administrateur")
        print("   • Docker: docker run --privileged --net=host sentinel-ids")
        sys.exit(1)
    

    
    # Création des répertoires
    # create_model_directory()
    
    # Configuration de l'environnement
    env_file = Path(".env")
    if not env_file.exists():
        print("📝 Création du fichier de configuration...")
        import shutil
        shutil.copy(".env.example", ".env")
        print("✅ Fichier .env créé (modifiez selon vos besoins)")
    
    print("\n🚀 Démarrage de Sentinel IDS...")
    print("   Service WebSocket: ws://localhost:8765")
    print("   Dashboard Web: http://localhost:3000")
    print("   Logs: sentinel_capture.log")
    print("\n📊 Ouvrez le dashboard web pour voir les données en temps réel")
    print("🛑 Appuyez sur Ctrl+C pour arrêter\n")
    
    # Démarrage du service principal
    try:
        from sentinel_capture import main
        import asyncio
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Arrêt demandé par l'utilisateur")
    except ImportError as e:
        print(f"❌ Erreur d'import: {e}")
        print("   Vérifiez que toutes les dépendances sont installées")
    except Exception as e:
        print(f"❌ Erreur: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()