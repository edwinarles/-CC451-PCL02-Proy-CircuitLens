# Arquitectura de CircuitLens

Este documento describe la arquitectura de software de **CircuitLens**, un asistente inteligente y laboratorio de electrónica móvil en formato Progressive Web App (PWA) con soporte de Realidad Aumentada (AR), interacción multimodal (voz y subtítulos) y diagnóstico pedagógico automatizado.

---

## 1. Diagramas C4

### Nivel 1: Diagrama de Contexto del Sistema (System Context)

El siguiente diagrama ilustra cómo los estudiantes e instructores interactúan con CircuitLens y con los servicios externos de Inteligencia Artificial.

```mermaid
C4Context
    title Diagrama de Contexto - CircuitLens

    Person(estudiante, "Estudiante", "Estudiante de ingeniería/electrónica que monta prototipos en el protoboard.")
    Person(instructor, "Instructor / Docente", "Profesor que monitorea, guía y anota en tiempo real sobre el circuito.")

    System(circuitlens, "CircuitLens (PWA)", "Laboratorio de electrónica móvil con AR, voz, panel del instructor y analítica.")

    System_Ext(claude, "Anthropic Claude API", "Servicio remoto de LLM multimodal para análisis avanzado de circuitos.")
    System_Ext(ollama, "Ollama / Llama Local", "Servicio de inferencia local multimodal (Llama 3.2-Vision) para privacidad y soberanía de datos.")

    Rel(estudiante, circuitlens, "Interactúa por voz, video AR y táctil")
    Rel(instructor, circuitlens, "Dibuja anotaciones y observa métricas")
    Rel(circuitlens, claude, "Envía estado del circuito (JSON/imagen) para diagnóstico remoto", "HTTPS")
    Rel(circuitlens, ollama, "Envía telemetría/imágenes a endpoint local", "HTTP/REST")
```

---

### Nivel 2: Diagrama de Contenedores (Container Diagram)

CircuitLens opera como una aplicación web progresiva (PWA) cliente-céntrica que puede ejecutarse completamente desconectada (offline) o complementarse con APIs externas.

```mermaid
C4Container
    title Diagrama de Contenedores - CircuitLens

    Person(usuario, "Usuario", "Estudiante o Instructor")

    Container_Boundary(pwa, "CircuitLens Client (Navegador Móvil / Desktop)") {
        Container(ui, "Capa de Presentación & UI", "HTML5, CSS3, SVG Dinámico", "Renderiza protoboard, guías AR, subtítulos, canvas de confeti y paneles.")
        Container(app_core, "Núcleo de la Aplicación", "JavaScript ES6+", "Control de estados, renderizado SVG, reconocimiento de voz y síntesis TTS.")
        Container(llm_gateway, "Capa LLM Agnóstica", "JavaScript ES6+", "Enrutador desacoplado con fallback: Simulado local ↔ Claude ↔ Ollama.")
        Container(storage, "Almacenamiento Local", "LocalStorage / Web Storage", "Persistencia de estado del estudiante, historial de errores y latencias.")
        Container(sync_bus, "Canal de Sincronización", "BroadcastChannel / WebSockets", "Sincronización de anotaciones bidireccionales entre estudiante e instructor.")
    }

    System_Ext(anthropic_api, "Anthropic Claude", "Inferencia cloud en tiempo real")
    System_Ext(ollama_api, "Ollama Server", "Inferencia local en puerto 11434")

    Rel(usuario, ui, "Usa la interfaz gráfica")
    Rel(ui, app_core, "Eventos de usuario y flujo de aprendizaje")
    Rel(app_core, storage, "Guarda y recupera progreso")
    Rel(app_core, sync_bus, "Transmite y escucha trazos de la sala")
    Rel(app_core, llm_gateway, "Solicita diagnóstico del estado actual")
    Rel(llm_gateway, anthropic_api, "Solicitud POST JSON con API Key", "HTTPS")
    Rel(llm_gateway, ollama_api, "Solicitud POST JSON a localhost", "HTTP")
```

---

### Nivel 3: Diagrama de Componentes (Component Diagram)

Detalle de los módulos internos en `script.js` y su interacción con los elementos del DOM:

```mermaid
graph TD
    subgraph UI_Layer ["Capa de Interfaz (DOM / SVG)"]
        SVG_Board["Protoboard SVG (#bd, #ib)"]
        Cam_Video["Video Stream AR (#vid)"]
        Voice_Captions["Subtítulos & Log (#cap, #log)"]
        Nav_Tabs["Gestor de Pestañas (Estudiante / Instructor / Org / Ajustes)"]
    end

    subgraph Core_Logic ["Lógica del Núcleo"]
        Engine["Motor de Renderizado & Coordenadas (xy, comp, draw, render)"]
        Voice_Ctrl["Controlador de Voz (listen, say, SpeechRecognition, SpeechSynthesis)"]
        Multiuser["Módulo Multiusuario (BroadcastChannel, ann)"]
        Metrics_Mod["Módulo de Analítica Institucional (metrics)"]
        State_Mgr["Gestor de Estado (S, P, save, LocalStorage)"]
    end

    subgraph LLM_Agnostic ["Capa LLM Agnóstica"]
        LLM_Router["LLM.run() Router"]
        Sim_Engine["LLM.sim() Heurístico Local"]
        Claude_Adapter["LLM.claude() Adaptador Anthropic"]
        Ollama_Adapter["LLM.ollama() Adaptador Ollama Vision"]
    end

    Nav_Tabs --> State_Mgr
    Engine --> SVG_Board
    Cam_Video --> SVG_Board
    Voice_Ctrl --> Voice_Captions
    Multiuser --> Engine
    State_Mgr --> Engine
    State_Mgr --> Metrics_Mod

    Engine --> LLM_Router
    LLM_Router -->|Fallback < 2.5s| Sim_Engine
    LLM_Router --> Claude_Adapter
    LLM_Router --> Ollama_Adapter
```

---

## 2. Componentes Principales

1. **Motor de Renderizado SVG (`draw`, `comp`, `xy`)**:
   - Mapea coordenadas lógicas de protoboard estándar (rieles `p1-p20`, `m1-m20` y pistas `1a-20j`) a píxeles exactos.
   - Genera dinámicamente guías animadas de Realidad Aumentada (clase `.ring`), cables, diodos LED con indicación de polaridad y resistencias con su código de colores de 4 bandas.

2. **Capa LLM Agnóstica (`LLM`)**:
   - Patrón **Adapter / Strategy** que abstrae el proveedor de inteligencia artificial.
   - Si se selecciona un proveedor remoto y este no responde dentro de la ventana de tolerancia (2.5 s) o no cuenta con conexión, se degrada elegantemente al motor heurístico simulado (`LLM.sim`), garantizando cero interrupciones en la clase.

3. **Módulo de Asistencia Multimodal e Inclusiva**:
   - **Voz y Escucha**: Soporta comandos de voz en español mediante la Web Speech API (`SpeechRecognition`) y respuesta hablada sintética (`SpeechSynthesis`).
   - **Subtitulado Accesible**: Subtítulos de alta visibilidad para personas con discapacidad auditiva o entornos ruidosos de laboratorio.
   - **Accesibilidad Universal**: Daltonismo (rotulado textual en resistencias), alto contraste (paleta para baja visión) y baja estimulación (eliminación de animaciones para usuarios con hipersensibilidad o TDAH).

4. **Canal Multiusuario en Tiempo Real**:
   - Emplea `BroadcastChannel` local para intercomunicar pestañas simulando una red WebSockets de aula.
   - Permite al instructor ver el circuito del alumno y dibujar anotaciones visuales que desaparecen tras un lapso pedagógico de 10 segundos.

---

## 3. Decisiones de Arquitectura (ADR)

| Decisión | Justificación | Consecuencia |
|---|---|---|
| **PWA sin dependencias pesadas (Vanilla JS + CSS)** | Cero tiempos de compilación; carga instantánea en teléfonos de gama baja en laboratorios con conectividad limitada. | Máximo rendimiento y portabilidad directa vía `file:///` o servidor estático simple. |
| **Capa LLM Agnóstica con Timeout y Fallback** | Un corte de internet o una caída de API de terceros no debe detener la práctica formativa del alumno. | Alta disponibilidad garantizada en aula (SLA 100% mediante fallback local). |
| **Renderizado de Protoboard en SVG vectorial** | Escalabilidad nítida en pantallas Retina/Móvil y superposición transparente sobre la señal de cámara (`<video>`). | Facilidad para superponer efectos AR y animaciones CSS sin sobrecargar la GPU. |
| **Métricas Anonimizadas desde el Diseño** | Cumplimiento estricto de privacidad escolar y normativas de datos (FERPA/GDPR/Regulaciones locales). | No se almacenan identificadores personales; solo índices de éxito y latencia de respuesta. |
