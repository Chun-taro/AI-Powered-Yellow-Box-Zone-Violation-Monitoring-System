
import sys
import os

# Ensure the current directory is in sys.path
sys.path.append(os.getcwd())

modules_to_test = [
    "config.config",
    "utils.camera",
    "utils.helpers",
    "utils.get_zone_coordinates",
    "database.database",
    "ai_model.detect",
    "ai_model.tracker",
    "ai_model.color_detector",
    "utils.monitoring_service",
    "routes.dashboard_routes",
    "routes.api_routes",
    "app"
]

print(f"Testing imports from {os.getcwd()}...")

failed = []

for module in modules_to_test:
    try:
        __import__(module)
        print(f"[OK] Module '{module}' imported successfully.")
    except ImportError as e:
        print(f"[FAIL] Failed to import '{module}': {e}")
        failed.append(module)
    except Exception as e:
        print(f"[FAIL] Error importing '{module}': {e}")
        failed.append(module)

if failed:
    print(f"\nSummary: {len(failed)} modules failed to import.")
    print(f"Failed modules: {failed}")
    sys.exit(1)
else:
    print("\nAll modules imported successfully!")
    sys.exit(0)
