# Guía de Instalación y Configuración

CircuitLens está diseñado para ejecutarse de forma inmediata en cualquier navegador moderno sin requerir complejos pasos de compilación.

---

## 1. Requisitos Previos

- Navegador web moderno con soporte para WebRTC y Speech APIs (Google Chrome, Microsoft Edge, Safari o Firefox).
- *(Opcional)* **Python 3.8+** o **Node.js 18+** para servir la aplicación bajo protocolo HTTP (necesario para habilitar la cámara web y el micrófono por restricciones de seguridad del navegador).

---

## 2. Puesta en Marcha Rápida

### Opción A: Servidor HTTP con Python (Recomendada)
Abre una terminal en la raíz del repositorio y ejecuta:

```bash
# Iniciar servidor en el puerto 8000
python -m http.server 8000
```
Visita en tu navegador: [http://localhost:8000](http://localhost:8000) o [http://localhost:8000/src/circuitlens.html](http://localhost:8000/src/circuitlens.html)

### Opción B: Servidor HTTP con Node.js / npx
```bash
npx serve .
```

### Opción C: Ejecución Directa (Sin Servidor)
Puedes abrir directamente el archivo `src/circuitlens.html` o `index.html` haciendo doble clic.
> *Nota: Algunas funciones de hardware como la cámara web física (`getUserMedia`) y el micrófono pueden requerir un contexto seguro (`http://localhost` o `https://`).*

---

## 3. Configuración de Proveedores LLM

CircuitLens cuenta con una arquitectura de IA agnóstica configurable en la pestaña **Ajustes**:

### Proveedor 1: Simulado Local (Por Defecto)
- **Costo:** Gratuito.
- **Conectividad:** 100% offline.
- **Configuración:** Ninguna. Utiliza el motor heurístico integrado que valida pasos, polaridad de diodos, valores de resistencias y tiempos de respuesta (< 350 ms).

---

### Proveedor 2: Anthropic Claude (Remoto)
Permite utilizar modelos avanzados como `claude-sonnet-4-6` para razonamiento y diagnóstico pedagógico contextualizado.

#### Configuración en la Interfaz (UI):
1. Ve a la pestaña **Ajustes**.
2. En **Proveedor LLM**, selecciona `Claude (remoto)`.
3. Ingresa tu API Key en el campo **API key** (se almacena de forma segura únicamente en la memoria de sesión del navegador).

#### Configuración mediante Variable de Entorno (`ANTHROPIC_API_KEY`):
Si deseas desplegar CircuitLens con un proxy inverso para no exponer claves en el navegador de los estudiantes:

**En Linux / macOS:**
```bash
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```

**En Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-api03-..."
```

---

### Proveedor 3: Ollama / Llama Vision (Local)
Permite inferencia multimodal local y privada sin conexión a internet ni consumo de tokens de pago.

#### Paso 1: Instalar Ollama
Descarga e instala Ollama desde [ollama.com](https://ollama.com).

#### Paso 2: Descargar el modelo multimodal
En tu terminal ejecuta:
```bash
ollama run llama3.2-vision
```

#### Paso 3: Permitir solicitudes desde el navegador (CORS)
Por defecto, Ollama solo acepta peticiones desde su propio origen. Para permitir que CircuitLens se comunique con Ollama desde el navegador:

**En Windows (PowerShell):**
```powershell
$env:OLLAMA_ORIGINS = "*"
ollama serve
```

**En Linux / macOS:**
```bash
OLLAMA_ORIGINS="*" ollama serve
```

#### Paso 4: Activar en CircuitLens
1. Abre CircuitLens y dirígete a la pestaña **Ajustes**.
2. En **Proveedor LLM**, selecciona `Ollama / Llama (local)`.
3. CircuitLens enviará automáticamente las solicitudes de diagnóstico al endpoint `http://localhost:11434/api/generate`.

---

## 4. Solución de Problemas Comunes

| Síntoma | Causa | Solución |
|---|---|---|
| *«No pude abrir la cámara»* | Restricción de permisos o protocolo `file://` | Ejecuta la aplicación usando `python -m http.server 8000` y autoriza los permisos de cámara en la barra del navegador. |
| *«Tu navegador no soporta voz»* | La Web Speech API no está habilitada o el navegador es incompatible | Utiliza navegadores basados en Chromium (Chrome, Edge) que cuentan con soporte nativo completo para reconocimiento por voz. |
| *«Proveedor remoto no disponible: se usó el simulado»* | La API Key de Claude es inválida, se agotó la cuota, o expiró el timeout de 2.5 s | CircuitLens activa el fallback automático hacia el motor heurístico local para que la práctica no se detenga. |
