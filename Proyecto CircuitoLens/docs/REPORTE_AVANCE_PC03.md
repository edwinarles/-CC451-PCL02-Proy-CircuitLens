# 📄 Reporte de Avance del Proyecto - Práctica Calificada 03 (PC03)
## Curso: CC451 Interacción Humano Computador
**Proyecto:** CircuitLens · Laboratorio de Electrónica Móvil con Asistente Multimodal e Interfases No Convencionales  
**Autor:** Edwin  
**Ciclo:** 2026-2  

---

## 1. Resumen Ejecutivo del Avance al 70%+

CircuitLens es un laboratorio de circuitos electrónicos en formato **Progressive Web App (PWA)** que transforma cualquier laptop o smartphone en un banco de trabajo inteligente sin necesidad de instalar dependencias externas pesadas.

El proyecto ha alcanzado más del **70% de implementación funcional**, con 5 pantallas/vistas completas programadas, superando las 6 capacidades obligatorias del curso:
1. **Interfases de Voz:** Reconocimiento de voz continuo (manos libres con palabra clave «*CircuitLens*»), comandos push-to-talk, subtítulos en vivo y síntesis de voz (TTS) con visualizador dinámico de onda sonora.
2. **Capa LLM Agnóstica y Resiliente:** Soporte desacoplado para **Google Gemini**, **Anthropic Claude**, **OpenAI**, **Ollama Local** y un **Motor Heurístico Simulado Local** (< 350 ms, 100% offline). Configurable mediante archivo `.env` o interfaz gráfica, con mecanismo de *fallback* automático ante caídas de red o timeouts (> 2.5 s).
3. **Plataforma PWA:** Service Worker con estrategia *Cache-First/Stale-While-Revalidate*, manifiesto enriquecido (`manifest.json`), botón de instalación directa (`beforeinstallprompt`) y operatividad garantizada sin conexión a internet.
4. **Personalización Continua:** Perfil de usuario persistente (`localStorage`) que monitorea en tiempo real:
   - *Preferencias:* nivel de detalle pedagógico, tono del asistente, velocidad de voz.
   - *Ritmo:* medición de segundos por paso y clasificación dinámica (*Pausado*, *Constante*, *Ágil*).
   - *Errores:* registro categorizado de fallos frecuentes (polaridad de diodo, resistencia omitida).
   - *Emociones declaradas e inferidas:* selector interactivo de ánimo (😊, 🤔, 😓, ⚡, 😴) y detección automática de frustración por errores repetidos, modulando las respuestas del tutor.
5. **Multiusuario con Salas:** Sistema de salas nombradas (ej. `SALA-ELECTRO-1`), sincronización bidireccional mediante `BroadcastChannel` y `localStorage`, panel de visualización de protoboards de alumnos en vivo para el instructor, pizarra de dibujo compartido y envío de pistas pedagógicas afectivas.
6. **Diseño Emocional de Don Norman:**
   - *Nivel Visceral:* Protoboard vectorial realista, resplandor dinámico de encendido de LEDs (`drop-shadow`), confeti de celebración y visualizador de onda.
   - *Nivel Conductual:* Clic directo en pines interactivos para montaje táctil, retroalimentación háptica (vibración) y *Earcons* musicales sintetizados en tiempo real mediante **Web Audio API** (arpegio de éxito Do-Mi-Sol y tono suave de advertencia).
   - *Nivel Reflexivo:* Tarjeta de metacognición al completar cada circuito («¿Qué aprendiste hoy?» con explicación física de la Ley de Ohm y semiconductores) y tono empático adaptativo.

---

## 2. Historias de Usuario con Criterios de Aceptación (Gherkin)

### HU01: Asistencia y Diagnóstico por Voz Manos Libres
**Como** estudiante que tiene ambas manos ocupadas insertando componentes en el protoboard físico,  
**Quiero** consultar a CircuitLens mediante comandos de voz continuos o por botón,  
**Para** recibir retroalimentación auditiva y visual inmediata sin soltar las herramientas.

- **Criterio de Aceptación 1.1 (Palabra Clave):**
  - **Dado que** el estudiante activa el «Modo manos libres» en la aplicación,
  - **Cuando** pronuncia en voz alta: *«CircuitLens, revisa mi circuito»*,
  - **Entonces** la aplicación procesa la solicitud, activa el visualizador de onda de voz y reproduce el diagnóstico en audio mediante TTS y subtítulos en pantalla en menos de 3 segundos.
- **Criterio de Aceptación 1.2 (Comandos de Navegación):**
  - **Dado que** el estudiante está en el paso 2 de un circuito,
  - **Cuando** dice *«siguiente paso»* o *«cuál es el valor de la resistencia»*,
  - **Entonces** el sistema avanza el paso o lee en voz alta los datos de colores y ohmios correspondientes.

---

### HU02: Capa LLM Agnóstica con Tolerancia a Fallos y Archivo `.env`
**Como** docente o evaluador del laboratorio,  
**Quiero** poder configurar el proveedor de inteligencia artificial (Gemini, Claude, OpenAI, Ollama o Simulado) mediante un archivo `.env` o en la interfaz,  
**Para** garantizar que la práctica nunca se detenga ante fallos de conexión o cuotas de API.

- **Criterio de Aceptación 2.1 (Configuración .env):**
  - **Dado que** el usuario define `DEFAULT_LLM_PROVIDER=gemini` y `GEMINI_API_KEY=AIzaSy...` en el archivo `.env`,
  - **Cuando** inicia CircuitLens en su navegador,
  - **Entonces** el sistema carga automáticamente la clave y selecciona el modelo sin requerir reconfiguración manual.
- **Criterio de Aceptación 2.2 (Fallback Resiliente < 2.5s):**
  - **Dado que** se selecciona un proveedor remoto y se desconecta el Wi-Fi o la API supera los 2.5 segundos de espera,
  - **Cuando** el usuario solicita «Revisar circuito»,
  - **Entonces** el sistema conmuta transparentemente al motor heurístico simulado local, entregando el diagnóstico en < 350 ms y notificando el uso del motor de contingencia.

---

### HU03: Personalización Continua y Detección Emocional
**Como** estudiante con diferente velocidad de aprendizaje y tolerancia a la frustración,  
**Quiero** que el asistente recuerde mis errores recurrentes y adapte su tono según cómo me siento,  
**Para** aprender a mi propio ritmo con refuerzo positivo y sin ansiedad.

- **Criterio de Aceptación 3.1 (Emoción Declarada):**
  - **Dado que** el estudiante se siente trabado y pulsa el botón emocional *«😓 Frustrado»*,
  - **Cuando** solicita ayuda o comete una equivocación,
  - **Entonces** el asistente responde con un tono cálido y empático: *«No te preocupes, la polaridad invertida es el tropiezo más común al iniciar. ¡Vamos a resolverlo juntos!»*.
- **Criterio de Aceptación 3.2 (Inferencia de Ritmo y Dificultad):**
  - **Dado que** el estudiante tarda más de 30 segundos o comete 2 errores seguidos en el mismo circuito,
  - **Cuando** consulta la pestaña «Mi Perfil»,
  - **Entonces** el sistema clasifica su ritmo como *«Pausado y reflexivo»*, infiere un estado de *«Cauteloso / Confundido»* y recomienda explicaciones detalladas.

---

### HU04: PWA y Funcionamiento 100% Offline
**Como** alumno que asiste a un laboratorio con conectividad Wi-Fi limitada o intermitente,  
**Quiero** instalar la aplicación como una PWA nativa y poder utilizarla sin internet,  
**Para** no depender de la red para realizar mis prácticas de laboratorio.

- **Criterio de Aceptación 4.1 (Instalación PWA):**
  - **Dado que** el usuario ingresa desde Google Chrome o Microsoft Edge en laptop o móvil,
  - **Cuando** hace clic en el botón superior *«📲 Instalar App»*,
  - **Entonces** el sistema registra la aplicación en el sistema operativo con su ícono y pantalla completa independiente.
- **Criterio de Aceptación 4.2 (Caché Offline):**
  - **Dado que** la aplicación ya fue abierta al menos una vez,
  - **Cuando** el usuario apaga el Wi-Fi y recarga la página,
  - **Entonces** el Service Worker sirve todos los componentes, estilos y circuitos locales, mostrando la insignia *«⚡ Modo Offline (PWA)»*.

---

### HU05: Multiusuario con Salas y Colaboración Docente
**Como** profesor de laboratorio de electrónica,  
**Quiero** ingresar a una sala virtual compartida y ver el estado de protoboard de todos mis alumnos,  
**Para** dibujar correcciones visuales sobre su vista y enviar pistas pedagógicas en tiempo real.

- **Criterio de Aceptación 5.1 (Gestión de Salas):**
  - **Dado que** profesor y estudiante configuran el mismo código de sala (ej. `SALA-ELECTRO-1`),
  - **Cuando** el estudiante coloca un componente o tiene un error de polaridad,
  - **Entonces** la tarjeta del alumno en el panel del instructor se actualiza al instante con su progreso y estado emocional.
- **Criterio de Aceptación 5.2 (Pizarra Bidireccional y Pistas):**
  - **Dado que** el docente observa que un alumno tiene el LED invertido,
  - **Cuando** hace clic sobre el pin del protoboard en su pizarra o pulsa *«💡 Revisa la pata del LED»*,
  - **Entonces** aparece un círculo rojo de advertencia en el protoboard del estudiante y este escucha la pista con una alerta sonora suave.

---

### HU06: Diseño Emocional y Metacognición (Norman)
**Como** estudiante de ingeniería,  
**Quiero** recibir señales sensoriales agradables (visuales y acústicas) y entender el fundamento teórico del circuito al terminarlo,  
**Para** afianzar mis conocimientos de forma motivadora y memorable.

- **Criterio de Aceptación 6.1 (Diseño Visceral y Earcons):**
  - **Dado que** el estudiante monta el último componente sin errores,
  - **Cuando** el circuito queda cerrado,
  - **Entonces** el LED virtual emite un resplandor luminoso realista (`led-glow`), el sintetizador de audio reproduce un acorde musical de victoria Do-Mi-Sol y se despliega una lluvia de confeti.
- **Criterio de Aceptación 6.2 (Nivel Reflexivo / Metacognición):**
  - **Dado que** el circuito ha sido completado,
  - **Cuando** se visualiza la tarjeta reflexiva,
  - **Entonces** se presenta una síntesis conceptual del fenómeno físico demostrado (ej. caída de tensión de 1.8 V en diodo y función limitadora de la resistencia de 330 Ω).

---

## 3. Requerimientos Funcionales y No Funcionales

### Requerimientos Funcionales (RF)
| ID | Descripción Funcional | Módulo Responsable |
|---|---|---|
| **RF01** | Reconocimiento de voz continuo y por comando push-to-talk en español. | `src/script.js` (`listen`, `SR`) |
| **RF02** | Síntesis de voz (TTS) con control de velocidad, tono y subtitulado en vivo. | `src/script.js` (`say`, `#cap`) |
| **RF03** | Capa de abstracción LLM desacoplada con soporte para Gemini, Claude, OpenAI, Ollama y Simulado. | `src/script.js` (`LLM.run`, adaptadores) |
| **RF04** | Carga y parseo automático de credenciales desde archivo `.env`. | `src/script.js` (`loadEnvConfig`) |
| **RF05** | Perfil de usuario persistente con métricas de ritmo, errores acumulados y emociones declaradas/inferidas. | `src/script.js` (`UserProfile`) |
| **RF06** | Salas multiusuario colaborativas con sincronización de estado y anotaciones visuales en tiempo real. | `src/script.js` (`MultiUser`) |
| **RF07** | Renderizado vectorial de protoboard con guías AR animadas y pines táctiles interactivos. | `src/script.js` (`draw`, `comp`) |
| **RF08** | Motor de sonido acústico (Earcons) sintetizado mediante Web Audio API. | `src/script.js` (`SoundEngine`) |
| **RF09** | Accesibilidad universal: modo daltonismo, alto contraste y baja estimulación. | `src/script.js` y `src/style.css` |
| **RF10** | Panel institucional con analítica comparativa de cohorte anonimizada de 24 estudiantes. | `src/script.js` (`metrics`) |

### Requerimientos No Funcionales (RNF)
| ID | Atributo de Calidad | Especificación |
|---|---|---|
| **RNF01** | **Rendimiento y Latencia (SLA)** | El tiempo de respuesta de diagnóstico simulado local debe ser < 350 ms; el timeout de APIs remotas está acotado a 2.5 s. |
| **RNF02** | **Disponibilidad Offline** | La aplicación debe ser 100% operativa sin conexión a internet mediante Service Worker Cache API. |
| **RNF03** | **Portabilidad y Despliegue** | Debe ejecutarse de forma nativa en navegadores web modernos (desktop y móvil) sin frameworks pesados ni dependencias de compilación. |
| **RNF04** | **Accesibilidad (a11y)** | Cumplimiento de WCAG 2.1 Nivel AA en contrastes de color, targets táctiles mínimos de 44x44 px y subtítulos aria-live. |
| **RNF05** | **Privacidad de Datos (FERPA/GDPR)** | Las métricas analíticas institucionales deben ser estrictamente anonimizadas sin exponer nombres ni datos sensibles. |
| **RNF06** | **Usabilidad Emocional** | Las alertas ante errores deben emplear tonos suaves y micro-interacciones constructivas basadas en los niveles de Norman. |

---

## 4. Matriz de Trazabilidad Completa (PC03)

| Req. | Historia de Usuario | Criterio de Aceptación | Componente / Archivo de Código | Evidencia / Método de Verificación |
|---|---|---|---|---|
| **RF01** | HU01 (Voz) | CA 1.1, CA 1.2 | `src/script.js` L349-385 | Reconocimiento continuo con palabra clave «CircuitLens» y comandos por botón. |
| **RF02** | HU01 (TTS) | CA 1.1 | `src/script.js` L216-235 | Subtítulos en `#cap`, animación en `#v-wave` y locución en español `es-PE`. |
| **RF03** | HU02 (LLM) | CA 2.1, CA 2.2 | `src/script.js` L236-298 | Capa agnóstica con adaptadores `gemini`, `claude`, `openai`, `ollama` y `sim`. |
| **RF04** | HU02 (.env) | CA 2.1 | `src/script.js` L160-205, `.env` | Lectura de variables `.env` vía HTTP fetch al cargar la PWA. |
| **RF05** | HU03 (Perfil) | CA 3.1, CA 3.2 | `src/script.js` L80-155 | Objeto `UserProfile` guardado en `localStorage` con cálculo de ritmo y emociones. |
| **RF06** | HU05 (Salas) | CA 5.1, CA 5.2 | `src/script.js` L386-485 | Canales `BroadcastChannel` y storage sync para tableros de alumnos en vivo. |
| **RF07** | HU06 (AR) | CA 6.1 | `src/script.js` L170-215 | SVG interactivo con anillos pulsantes `.ring` clickeables y resplandor de LED. |
| **RF08** | HU06 (Audio) | CA 6.1 | `src/script.js` L40-79 | `SoundEngine` sintetiza acordes Do-Mi-Sol y tonos de alerta con Web Audio API. |
| **RF09** | HU01 (a11y) | CA 1.2 | `src/style.css`, `src/script.js` | Modos `.hc` (alto contraste), `.calm` (sin animación) y daltonismo con textos en ohmios. |
| **RF10** | HU02 (Analítica) | CA 2.2 | `src/script.js` L510-530, `data/cohorte.json` | Visualización comparativa de barras con 24 alumnos simulados. |

---

## 5. Justificación del Prototipo Funcional al 70%+ (5 Pantallas Programadas)

1. **Pantalla 1: Estudiante (Laboratorio AR & Tutor Afectivo)**
   - Protoboard SVG interactivo con inserción de componentes táctil o por botón.
   - Transmisión de cámara física superpuesta (Realidad Aumentada).
   - Barra de estado anímico con emojis reactivos (😊, 🤔, 😓, ⚡, 😴).
   - Visualizador dinámico de onda de voz y subtítulos accesibles permanentes.
   - Tarjeta reflexiva metacognitiva tras cada circuito completado.

2. **Pantalla 2: Instructor (Salas y Colaboración en Tiempo Real)**
   - Selector y gestor de salas con código compartible (`?sala=...`).
   - Roster de estudiantes conectados en la sala con indicador de estado (en progreso, LED invertido, o pidiendo ayuda).
   - Pizarra de anotación bidireccional sobre el circuito del alumno.
   - Botones de acción rápida para enviar pistas pedagógicas afectivas.

3. **Pantalla 3: Mi Perfil (Personalización Continua)**
   - Dashboard individual del estudiante con estadísticas de ritmo (segundos por paso).
   - Monitoreo del historial de emociones declaradas e inferidas.
   - Catálogo de errores frecuentes con sugerencias pedagógicas de refuerzo.
   - Selector de tono del tutor (empático, socrático, técnico).

4. **Pantalla 4: Institución (Analítica de Cohorte Anonimizada)**
   - Métricas agregadas de 24 estudiantes simulados (`data/cohorte.json`) combinados con la sesión local.
   - Gráfica de barras de completitud por circuito y distribución porcentual de errores.
   - Registro de latencia promedio de diagnóstico con IA (< 350 ms).

5. **Pantalla 5: Ajustes & LLM (Accesibilidad y Abstracción Tecnológica)**
   - Panel de conmutación de proveedores LLM: Simulado, Gemini, Claude, OpenAI, Ollama.
   - Estado de detección del archivo `.env` e ingreso de API keys.
   - Conmutadores de accesibilidad universal WCAG AA (daltonismo, alto contraste, audio earcons, vibración háptica, manos libres).

---

## 6. Guion Recomendado para la Sustentación en Video (3 Minutos)

Para cumplir con la rúbrica de sustentación individual de 3 minutos:

| Minuto | Contenido a Demostrar en Pantalla | Diálogo Clave |
|---|---|---|
| **0:00 - 0:45** | **Presentación & PWA Offline**<br>Mostrar la pantalla de Estudiante, el botón de PWA y el modo offline. | *«Buenas tardes profesor. Presento CircuitLens, una PWA de laboratorio de electrónica. Funciona 100% offline gracias a su Service Worker y permite montar circuitos en protoboard con asistencia multimodal.»* |
| **0:45 - 1:30** | **Interfase de Voz, AR y Capa LLM (.env)**<br>Pulsar el botón de voz o usar manos libres, simular error de LED invertido y solicitar «Revisa mi circuito». | *«Contamos con reconocimiento continuo de voz y una capa LLM agnóstica configurable en el archivo .env con Google Gemini, Claude, OpenAI y Ollama. Ante fallos de red, el motor local simulado responde en menos de 350 milisegundos con feedback afectivo.»* |
| **1:30 - 2:15** | **Personalización Continua & Diseño Emocional de Norman**<br>Cambiar la emoción a "Frustrado", mostrar cómo el tutor adapta su tono, y mostrar los Earcons y el LED con resplandor. | *«Implementamos los tres niveles de Don Norman: a nivel visceral el LED se enciende con resplandor realista; a nivel conductual sintetizamos earcons musicales con Web Audio API; y a nivel reflexivo adaptamos el tono del tutor si el alumno se siente frustrado.»* |
| **2:15 - 3:00** | **Salas Multiusuario & Panel del Instructor**<br>Cambiar a la pestaña Instructor, mostrar los alumnos en la sala, hacer un trazo en la pizarra y verificar cómo aparece en el protoboard. | *«Finalmente, en el panel multiusuario por salas, el profesor visualiza en tiempo real los tableros de sus alumnos y puede enviar pistas afectivas o dibujar anotaciones visuales colaborativas.»* |

