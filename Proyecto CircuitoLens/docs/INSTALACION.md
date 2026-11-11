# Guía de Instalación y Configuración · CircuitLens

CircuitLens es una aplicación web progresiva (PWA) de arquitectura cliente-céntrica (Vanilla HTML5, CSS3 y JavaScript ES6+). No requiere pasos pesados de compilación (`npm run build`), ejecutándose de inmediato en cualquier navegador moderno.

---

## 1. Requisitos Previos

- Navegador web moderno con soporte para WebRTC, Web Audio y Speech APIs (Google Chrome, Microsoft Edge, Safari o Mozilla Firefox).
- Servidor web local para habilitar permisos de hardware (cámara y micrófono):
  - **Python 3.8+** (Recomendado) o **Node.js 18+** (`npx serve` o `http-server`).

---

## 2. Puesta en Marcha en 3 Pasos

### Paso 1: Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/Proyecto-CircuitoLens.git
cd Proyecto-CircuitoLens
```

### Paso 2: Configurar el archivo `.env` (Opcional para APIs remotas)
El proyecto incluye un archivo de configuración `.env` en la raíz. Si deseas conectar modelos de IA en la nube como Google Gemini, Anthropic Claude u OpenAI:

1. Abre el archivo `.env` en la raíz del proyecto.
2. Ingresa tus claves correspondientes:
   ```env
   # Proveedor activo por defecto: sim | gemini | claude | openai | ollama
   DEFAULT_LLM_PROVIDER=sim

   # Claves de API (Coloca tu clave según el proveedor deseado):
   GEMINI_API_KEY=AIzaSy...
   ANTHROPIC_API_KEY=sk-ant-api03-...
   OPENAI_API_KEY=sk-proj-...

   # Inferencia Local Soberana:
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_MODEL=llama3.2-vision
   ```
> *Nota: Si no cuentas con claves de API remotas, déjalas en blanco. CircuitLens utilizará automáticamente el **Motor Simulado Local**, el cual es 100% offline, gratuito y responde en menos de 350 ms.*

### Paso 3: Iniciar el servidor local
Para que el navegador permita el acceso a la cámara y al micrófono, se debe servir por HTTP (`localhost`):

**Con Python:**
```bash
python -m http.server 8000
```

**Con Node.js:**
```bash
npx serve .
```

Abre en tu navegador:
👉 **[http://localhost:8000/src/circuitlens.html](http://localhost:8000/src/circuitlens.html)** (o directamente `http://localhost:8000`).

---

## 3. Instalación como PWA en Laptop o Móvil

1. Abre la aplicación en Google Chrome o Microsoft Edge.
2. Observarás en la barra superior el botón **«📲 Instalar App»** o el ícono de instalación en la barra de direcciones del navegador.
3. Al hacer clic en **Instalar**, CircuitLens se agregará como aplicación de escritorio o acceso directo móvil independiente, funcionando con pantalla completa y soporte 100% offline gracias al Service Worker pre-configurado.

---

## 4. Configuración de Proveedores LLM

CircuitLens ofrece una arquitectura agnóstica configurable tanto desde el archivo `.env` como desde la pestaña **Ajustes & LLM** de la aplicación:

### Proveedor 1: Simulado Local (Por Defecto)
- **Costo:** Gratuito.
- **Conectividad:** 100% offline (sin internet).
- **Latencia:** < 350 ms.
- **Uso:** Ideal para laboratorios con conectividad inestable o nula.

### Proveedor 2: Google Gemini (Recomendado para la Nube)
- **Modelo:** `gemini-1.5-flash` o `gemini-2.0-flash`.
- **Configuración:** Ingresa tu clave en `GEMINI_API_KEY` dentro de `.env` o en el campo de **API Key** en la pestaña de Ajustes.
- Obtén tu clave gratuita en: [Google AI Studio](https://aistudio.google.com/).

### Proveedor 3: Anthropic Claude
- **Modelo:** `claude-sonnet-4-6` / `claude-3-5-sonnet`.
- **Configuración:** Ingresa tu clave en `ANTHROPIC_API_KEY` en `.env` o en la pestaña de Ajustes.
- Obtén tu clave en: [Anthropic Console](https://console.anthropic.com/).

### Proveedor 4: OpenAI
- **Modelo:** `gpt-4o-mini`.
- **Configuración:** Ingresa tu clave en `OPENAI_API_KEY` en `.env` o en la pestaña de Ajustes.

### Proveedor 5: Ollama Local (Inferencia Soberana y Privada)
Permite correr modelos multimodales directamente en tu tarjeta gráfica local sin enviar datos al exterior:

1. Instala Ollama desde [ollama.com](https://ollama.com).
2. Descarga el modelo:
   ```bash
   ollama run llama3.2-vision
   ```
3. Inicia el servicio permitiendo CORS para el navegador:
   - **En Windows (PowerShell):**
     ```powershell
     $env:OLLAMA_ORIGINS = "*"
     ollama serve
     ```
   - **En Linux / macOS:**
     ```bash
     OLLAMA_ORIGINS="*" ollama serve
     ```
4. En CircuitLens, selecciona en Ajustes: `Ollama Local (llama3.2-vision)`.

---

## 5. Pruebas y Demostración Rápida

Para verificar el funcionamiento integral en una presentación o sustentación:
1. Pulsa el botón **«▶ Simulación guiada»** en la barra superior.
2. La aplicación simulará automáticamente el montaje paso a paso, generará un error de polaridad invertida en el LED, consultará al LLM y reproducirá la retroalimentación de voz y visual de Don Norman.
