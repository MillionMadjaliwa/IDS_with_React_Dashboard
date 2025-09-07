from sentinel_capture import main as sentinel_main
import asyncio

if __name__ == "__main__":
    try:
        asyncio.run(sentinel_main())
    except KeyboardInterrupt:
        print("\n🛑 Service arrêté manuellement")
