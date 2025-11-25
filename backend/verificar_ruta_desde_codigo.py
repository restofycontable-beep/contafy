"""
Script para verificar que la ruta /api/auth/forgot-password existe en el código
Ejecutar este script en el servidor para verificar que todo está correcto
"""

import sys
import os

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(__file__))

print("=" * 60)
print("VERIFICACIÓN DE RUTA /api/auth/forgot-password")
print("=" * 60)
print()

# 1. Verificar que el archivo auth_routes.py existe
print("1. Verificando archivo auth_routes.py...")
if os.path.exists("routes/auth_routes.py"):
    print("   ✅ Archivo routes/auth_routes.py existe")
else:
    print("   ❌ ERROR: Archivo routes/auth_routes.py NO existe")
    sys.exit(1)
print()

# 2. Verificar que la ruta existe en el código
print("2. Verificando que la ruta existe en el código...")
with open("routes/auth_routes.py", "r", encoding="utf-8") as f:
    content = f.read()
    if "@router.post(\"/forgot-password\")" in content or '@router.post("/forgot-password")' in content:
        print("   ✅ Ruta /forgot-password encontrada en auth_routes.py")
        # Buscar la línea
        for i, line in enumerate(content.split("\n"), 1):
            if "forgot-password" in line:
                print(f"   Línea {i}: {line.strip()}")
                break
    else:
        print("   ❌ ERROR: Ruta /forgot-password NO encontrada en auth_routes.py")
        sys.exit(1)
print()

# 3. Verificar que PasswordResetRequest está importado
print("3. Verificando importaciones...")
if "PasswordResetRequest" in content:
    print("   ✅ PasswordResetRequest está importado")
else:
    print("   ❌ ERROR: PasswordResetRequest NO está importado")
    sys.exit(1)
print()

# 4. Verificar que está registrado en main.py
print("4. Verificando que auth_routes está registrado en main.py...")
if os.path.exists("main.py"):
    with open("main.py", "r", encoding="utf-8") as f:
        main_content = f.read()
        if "app.include_router(auth_routes.router" in main_content:
            print("   ✅ auth_routes está registrado en main.py")
            # Buscar la línea
            for i, line in enumerate(main_content.split("\n"), 1):
                if "auth_routes.router" in line:
                    print(f"   Línea {i}: {line.strip()}")
                    break
        else:
            print("   ❌ ERROR: auth_routes NO está registrado en main.py")
            sys.exit(1)
else:
    print("   ❌ ERROR: Archivo main.py NO existe")
    sys.exit(1)
print()

# 5. Intentar importar y verificar que la ruta está en el router
print("5. Verificando que la ruta está disponible en el router...")
try:
    from routes.auth_routes import router
    
    # Buscar la ruta forgot-password
    found = False
    for route in router.routes:
        if hasattr(route, 'path') and route.path == "/forgot-password":
            found = True
            print(f"   ✅ Ruta encontrada en router: {route.path}")
            if hasattr(route, 'methods'):
                print(f"   Métodos: {route.methods}")
            break
        elif hasattr(route, 'path_regex') and 'forgot-password' in str(route.path_regex):
            found = True
            print(f"   ✅ Ruta encontrada en router (regex): {route.path_regex}")
            break
    
    if not found:
        print("   ❌ ERROR: Ruta /forgot-password NO encontrada en el router")
        print("   Rutas disponibles en auth_routes:")
        for route in router.routes:
            if hasattr(route, 'path'):
                print(f"      - {route.path}")
        sys.exit(1)
except Exception as e:
    print(f"   ❌ ERROR al importar router: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
print()

# 6. Verificar que está en la app de FastAPI
print("6. Verificando que la ruta está registrada en la app de FastAPI...")
try:
    from main import app
    
    # Buscar la ruta forgot-password en la app
    found = False
    for route in app.routes:
        if hasattr(route, 'path') and 'forgot-password' in route.path:
            found = True
            print(f"   ✅ Ruta encontrada en app: {route.path}")
            if hasattr(route, 'methods'):
                print(f"   Métodos: {route.methods}")
            break
        elif hasattr(route, 'path_regex') and 'forgot-password' in str(route.path_regex):
            found = True
            print(f"   ✅ Ruta encontrada en app (regex): {route.path_regex}")
            break
    
    if not found:
        print("   ❌ ERROR: Ruta /api/auth/forgot-password NO encontrada en la app")
        print("   Rutas de /api/auth disponibles:")
        auth_routes_list = [r for r in app.routes if hasattr(r, 'path') and '/api/auth' in str(r.path)]
        for route in auth_routes_list[:10]:  # Mostrar las primeras 10
            print(f"      - {route.path}")
    else:
        print("   ✅ La ruta está correctamente registrada en la app")
except Exception as e:
    print(f"   ❌ ERROR al importar app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
print()

print("=" * 60)
print("✅ VERIFICACIÓN COMPLETADA")
print("=" * 60)
print()
print("Si todos los checks pasaron, el código está correcto.")
print("El problema debe ser que el servidor no se reinició correctamente.")
print()
print("SIGUIENTE PASO: Reiniciar el servidor backend")
print()

