# Arquitectura del Sistema CircuitLens

Este documento describe la arquitectura de software de **CircuitLens**, un asistente inteligente y laboratorio de electrónica móvil en formato Progressive Web App (PWA) con soporte de Realidad Aumentada (AR), interacción multimodal no convencional (voz, subtítulos y earcons), personalización continua, salas multiusuario en tiempo real, capa LLM agnóstica con resiliencia, y diseño emocional basado en los tres niveles de Don Norman.

---

## 1. Diagramas C4

### Nivel 1: Diagrama de Contexto del Sistema (System Context)

El siguiente diagrama ilustra cómo los estudiantes e instructores interactúan con CircuitLens y con la diversidad de proveedores de Inteligencia Artificial locales y remotos.

```mermaid
C4Context
    title Diagrama de Contexto - CircuitLens (PC03)

    Person(estudiante, "Estudiante", "Estudiante de ingeniería/electrónica que monta prototipos en el protoboard interactivo.")
    Person(instructor, "Instructor / Docente", "Profesor que monitorea salas en vivo, guía alumnos y realiza anotaciones en tiempo real.")

    System(circuitlens, "CircuitLens (PWA)", "Laboratorio de electrónica móvil con AR, voz continua, perfil adaptativo, salas multiusuario y diseño emocional.")

    System_Ext(gemini, "Google Gemini API", "LLM multimodal en la nube (gemini-1.5-flash / gemini-2.0-flash) para diagnóstico pedagógico.")
    System_Ext(claude, "Anthropic Claude API", "LLM remoto para razonamiento contextual profundo (claude-sonnet-4-6).")
    System_Ext(openai, "OpenAI API", "Modelo de razonamiento rápido (gpt-4o-mini).")
    System_Ext(ollama, "Ollama / Llama Local", "Inferencia multimodal privada y soberana (llama3.2-vision) en puerto 11434.")

    Rel(estudiante, circuitlens, "Interactúa por voz continua, video AR, táctil y selección de emociones")
    Rel(instructor, circuitlens, "Gestiona salas, inspecciona tableros y envía pistas afectivas")
    Rel(circuitlens, gemini, "Solicitud de diagnóstico pedagógico (REST/JSON)", "HTTPS")
    Rel(circuitlens, claude, "Solicitud de análisis multimodal", "HTTPS")
    Rel(circuitlens, openai, "Solicitud de completions estructurados", "HTTPS")
    Rel(circuitlens, ollama, "Inferencia soberana en localhost", "HTTP/REST")
```

---

### Nivel 2: Diagrama de Contenedores (Container Diagram)

CircuitLens opera como una Progressive Web App (PWA) cliente-céntrica que combina almacenamiento offline garantizado mediante Service Workers con sincronización bidireccional entre salas:

```mermaid
C4Container
    title Diagrama de Contenedores - CircuitLens PWA

    Person(usuario, "Usuario", "Estudiante o Instructor")

    Container_Boundary(pwa, "CircuitLens PWA Client (Navegador Móvil / Desktop)") {
        Container(sw, "Service Worker (Offline Engine)", "JavaScript (Cache API)", "Pre-almacena HTML, CSS, JS, manifest y datasets. Provee funcionamiento 100% offline.")
        Container(ui, "Capa de Presentación & UI", "HTML5, CSS3 Dinámico, SVG", "Renderiza protoboard, guías AR interactivas, visualizador de voz y subtítulos.")
        Container(sound_engine, "Motor de Sonido (SoundEngine)", "Web Audio API", "Sintetiza earcons musicales de éxito, advertencia y clics mecánicos sin dependencias externas.")
        Container(profile_mgr, "Personalización Continua", "JavaScript ES6+", "Control de perfil persistente: preferencias, ritmo de montaje, catálogo de errores y emociones.")
        Container(multiuser_bus, "Gestor de Salas Multiusuario", "BroadcastChannel + LocalStorage", "Sincroniza tableros de alumnos, trazos del docente y alertas en salas independientes.")
        Container(llm_gateway, "Capa de Abstracción LLM", "JavaScript ES6+ con Fallback", "Enrutador agnóstico: Simulado Local ↔ Gemini ↔ Claude ↔ OpenAI ↔ Ollama.")
    }

    System_Ext(cloud_llm, "APIs de IA en la Nube", "Gemini / Claude / OpenAI")
    System_Ext(local_ollama, "Servidor Local Ollama", "Inferencia local en puerto 11434")

    Rel(usuario, ui, "Interactúa visual, táctil y auditivamente")
    Rel(ui, sound_engine, "Dispara retroalimentación acústica (earcons)")
    Rel(ui, profile_mgr, "Registra tiempos, errores y estados anímicos")
    Rel(ui, multiuser_bus, "Emite estado del circuito a la sala activa")
    Rel(ui, llm_gateway, "Solicita diagnóstico contextual del circuito")
    Rel(llm_gateway, cloud_llm, "Consulta API remota con API Key de .env", "HTTPS")
    Rel(llm_gateway, local_ollama, "Consulta inferencia local", "HTTP")
    Rel(sw, ui, "Suministra recursos estáticos en modo offline")
```

---

### Nivel 3: Diagrama de Componentes (Component Diagram)

Estructura modular interna del archivo `src/script.js`:

```mermaid
graph TD
    subgraph UI_Modules ["Capa de Interfaz de Usuario"]
        SVG_Engine["Renderizador SVG & Coordenadas (xy, comp, draw)"]
        AR_Video["Stream de Cámara AR (#vid)"]
        Voice_UI["Visualizador de Onda de Voz (#v-wave)"]
        Captions_Log["Subtítulos Fijos & Historial (#cap, #log)"]
        Tabs_Router["Enrutador de Pestañas (#est, #ins, #prf, #org, #aju)"]
    end

    subgraph Core_Services ["Servicios del Núcleo"]
        SoundEngine["SoundEngine (Web Audio API Earcons)"]
        UserProfile["UserProfile (Personalización Continua)"]
        MultiUser["MultiUser (Salas BroadcastChannel + Fallback Storage)"]
        VoiceController["VoiceController (SpeechRecognition + SpeechSynthesis)"]
        EnvLoader["loadEnvConfig (Parser dinámico de .env)"]
    end

    subgraph LLM_Agnostic_Layer ["Capa de Abstracción LLM"]
        LLM_Router["LLM.run() con Timeout 2.5s"]
        Sim_Engine["LLM.sim() Heurístico Local Offline"]
        Gemini_Adapter["LLM.gemini() Adaptador Google"]
        Claude_Adapter["LLM.claude() Adaptador Anthropic"]
        OpenAI_Adapter["LLM.openai() Adaptador OpenAI"]
        Ollama_Adapter["LLM.ollama() Adaptador Ollama Vision"]
    end

    Tabs_Router --> UserProfile
    SVG_Engine --> SoundEngine
    VoiceController --> Voice_UI
    VoiceController --> Captions_Log
    UserProfile --> MultiUser
    UserProfile --> LLM_Router

    SVG_Engine --> LLM_Router
    LLM_Router -->|Fallback automático| Sim_Engine
    LLM_Router --> Gemini_Adapter
    LLM_Router --> Claude_Adapter
    LLM_Router --> OpenAI_Adapter
    LLM_Router --> Ollama_Adapter
```

---

## 2. Marco de Diseño Emocional de Don Norman

CircuitLens implementa formalmente los tres niveles del procesamiento cognitivo y afectivo descritos por Don Norman en *Emotional Design*:

| Nivel de Norman | Dimensión de Diseño | Implementación en CircuitLens |
|---|---|---|
| **Nivel Visceral** | Estética inmediata, atracción sensorial, apariencia. | - Protoboard SVG de alta definición con pines de cobre y relieve vectorial.<br>- **Encendido de LED realista:** resplandor dinámico (`filter: drop-shadow`) y animación de luz pulsante cuando el circuito cierra con éxito.<br>- **Visualizador de onda de voz:** barras animadas que reaccionan cuando el asistente habla o escucha.<br>- Micro-interacciones de confeti multicromático al dominar un circuito. |
| **Nivel Conductual** | Usabilidad, efectividad operativa, placer de uso. | - **Pines interactivos clickeables:** el alumno puede tocar directamente los círculos verdes en el protoboard para insertar componentes.<br>- **Earcons sonoros (Web Audio API):** acorde ascendente Do-Mi-Sol para éxito, tono suave no punitivo para polaridad invertida y clic mecánico de inserción.<br>- Retroalimentación háptica (vibración modulada en móviles).<br>- Modo manos libres con palabra clave continua («*CircuitLens, revisa mi circuito*»). |
| **Nivel Reflexivo** | Significado personal, autoestima, metacognición. | - **Tono adaptativo del asistente:** empático (alentador ante frustración), socrático (preguntas guía) o técnico (rigor de ingeniería).<br>- **Tarjeta de Reflexión Metacognitiva:** al terminar un circuito, explica la física detrás del montaje (Ley de Ohm, caída de tensión del diodo, divisor resistivo).<br>- Registro persistente de emociones declaradas e inferidas para promover la mentalidad de crecimiento. |

---

## 3. Matriz de Decisiones Arquitecturales (ADR)

1. **ADR-01: Capa de Abstracción LLM con Fallback Local Resiliente**
   - *Decisión:* Encapsular proveedores en un enrutador único con timeout estricto de 2.5 s.
   - *Razón:* Un laboratorio práctico de universidad no puede depender de la estabilidad de la conexión Wi-Fi ni de cuotas de APIs externas. Si el proveedor falla, el motor heurístico local simulado responde en < 350 ms.

2. **ADR-02: Configuración Híbrida de Variables de Entorno (`.env`)**
   - *Decisión:* Permitir lectura automática de `.env` vía HTTP fetch al iniciar la PWA y permitir sobrescritura en memoria en la interfaz de Ajustes.
   - *Razón:* Facilita que el docente o evaluador coloque sus claves en un archivo `.env` estándar sin necesidad de compiladores o empaquetadores como Webpack/Vite.

3. **ADR-03: Multiusuario basado en Canales de Sala (`BroadcastChannel`)**
   - *Decisión:* Segmentar la comunicación en salas nombradas (`circuitlens_ROOMID`) complementadas con eventos `storage` de HTML5.
   - *Razón:* Permite demostraciones en vivo inmediatas abriendo dos pestañas en el mismo ordenador o sincronizando entre dispositivos sin desplegar servidores WebSockets complejos.

4. **ADR-04: Motor de Audio Cero Dependencias con Web Audio API**
   - *Decisión:* Sintetizar las ondas senoidales y cuadradas directamente en el navegador mediante osciladores y nodos de ganancia.
   - *Razón:* Garantiza que los efectos sonoros funcionen 100% offline sin descargar archivos `.mp3` o `.wav` que podrían fallar por latencia o CORS.
