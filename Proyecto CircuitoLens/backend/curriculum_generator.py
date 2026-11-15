"""
Curriculum generator script for CircuitLens.
Generates 5 levels x 10 structured labs = 50 university-level Electrical/Electronic Engineering laboratories.
Includes:
 - Learning objectives
 - Component specifications and values
 - Schematics & breadboard pin wiring (with pin coordinates compatible with the simulator)
 - Expected measurements and physical equations
 - Practical exercises & Troubleshooting scenarios
 - AI evaluation criteria
"""

import json
import os

LEVELS = [
    {
        "level": 1,
        "name": "Nivel 1 — Análisis Avanzado de Circuitos",
        "audience": "Ingeniería Eléctrica y Electrónica (Pregrado Avanzado)",
        "labs": [
            {
                "title": "Ley de Ohm y Análisis Nodal Básico",
                "objectives": "Comprobar la Ley de Ohm y el método de voltajes nodales en redes resistivas.",
                "equations": "I = V/R, sum(I_k) = 0",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Vcc 5V -> nodo 1"},
                               {"type": "res", "valor": 330, "de": "6b", "a": "10b", "etiqueta": "R1 (330 Ω)"},
                               {"type": "res", "valor": 1000, "de": "10c", "a": "14c", "etiqueta": "R2 (1 kΩ) a nodo 2"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND de referencia"}],
                "expected": "V_nodo2 = 3.76 V, I_total = 3.76 mA",
                "troubleshooting": "Si el voltaje en nodo 2 es 0V, verifique falso contacto en pin 10c."
            },
            {
                "title": "Análisis de Mallas y Ley de Voltajes de Kirchhoff (KVL)",
                "objectives": "Verificar la sumatoria de caídas de tensión en mallas cerradas independientes.",
                "equations": "sum(V_k) = 0",
                "components": [{"type": "wire", "color": "#d22", "de": "p2", "a": "5a", "etiqueta": "Línea de alimentación 5V"},
                               {"type": "res", "valor": 220, "de": "5b", "a": "9b", "etiqueta": "R_malla1 (220 Ω)"},
                               {"type": "res", "valor": 330, "de": "9c", "a": "13c", "etiqueta": "R_compartida (330 Ω)"},
                               {"type": "wire", "color": "#111", "de": "13e", "a": "m13", "etiqueta": "Retorno común a tierra"}],
                "expected": "Caída en R1 = 2.0V, Caída en R_compartida = 3.0V",
                "troubleshooting": "Discrepancia en KVL indica resistencia fuera de tolerancia."
            },
            {
                "title": "Principio de Superposición en Redes Lineales",
                "objectives": "Demostrar que la respuesta con múltiples fuentes es la suma de respuestas individuales.",
                "equations": "V_total = V'(V1=0) + V''(V2=0)",
                "components": [{"type": "wire", "color": "#d22", "de": "p4", "a": "7a", "etiqueta": "Fuente V1 (5V)"},
                               {"type": "res", "valor": 1000, "de": "7b", "a": "11b", "etiqueta": "R1 (1 kΩ)"},
                               {"type": "res", "valor": 2200, "de": "11c", "a": "15c", "etiqueta": "R_carga (2.2 kΩ)"},
                               {"type": "wire", "color": "#111", "de": "15e", "a": "m15", "etiqueta": "GND"}],
                "expected": "Corriente de rama lineal concordante con el cálculo analítico.",
                "troubleshooting": "No cortocircuitar la fuente de tensión durante la medición activa."
            },
            {
                "title": "Teorema de Thevenin y Circuito Equivalente",
                "objectives": "Obtener el voltaje de circuito abierto (Vth) y la resistencia equivalente (Rth).",
                "equations": "Vth = V_oc, Rth = V_oc / I_sc",
                "components": [{"type": "wire", "color": "#d22", "de": "p5", "a": "8a", "etiqueta": "Alimentación V_in"},
                               {"type": "res", "valor": 1000, "de": "8b", "a": "12b", "etiqueta": "R_thev1 (1 kΩ)"},
                               {"type": "res", "valor": 1000, "de": "12c", "a": "16c", "etiqueta": "R_thev2 divisor (1 kΩ)"},
                               {"type": "wire", "color": "#111", "de": "16e", "a": "m16", "etiqueta": "GND"}],
                "expected": "Vth = 2.50 V, Rth = 500 Ω",
                "troubleshooting": "Retirar la carga antes de medir V_oc en bornes."
            },
            {
                "title": "Teorema de Norton y Transformación de Fuentes",
                "objectives": "Evaluar la corriente de cortocircuito (I_N) y su equivalencia con Thevenin.",
                "equations": "I_N = Vth / Rth, R_N = Rth",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Fuente continua"},
                               {"type": "res", "valor": 330, "de": "6b", "a": "10b", "etiqueta": "R_rama (330 Ω)"},
                               {"type": "res", "valor": 2200, "de": "10c", "a": "14c", "etiqueta": "R_shunteo (2.2 kΩ)"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND"}],
                "expected": "I_Norton = 15.1 mA, R_N = 286.9 Ω",
                "troubleshooting": "Asegurar que el amperímetro no introduzca resistencia serie parásita excesiva."
            },
            {
                "title": "Máxima Transferencia de Potencia",
                "objectives": "Comprobar empíricamente que P_L es máxima cuando R_L = Rth.",
                "equations": "P_max = Vth^2 / (4 * Rth)",
                "components": [{"type": "wire", "color": "#d22", "de": "p4", "a": "7a", "etiqueta": "V_in 5V"},
                               {"type": "res", "valor": 1000, "de": "7b", "a": "11b", "etiqueta": "R_fuente (1 kΩ)"},
                               {"type": "res", "valor": 1000, "de": "11c", "a": "15c", "etiqueta": "R_carga óptima (1 kΩ)"},
                               {"type": "wire", "color": "#111", "de": "15e", "a": "m15", "etiqueta": "GND"}],
                "expected": "P_L máxima = 6.25 mW cuando R_L = 1 kΩ",
                "troubleshooting": "Con valores de R_L de 330 Ω o 2.2 kΩ la potencia útil decrece."
            },
            {
                "title": "Respuesta Transitoria de Circuitos RC de Primer Orden",
                "objectives": "Medir la constante de tiempo tau = R*C y la curva de carga y descarga exponencial.",
                "equations": "v_C(t) = V_0 * (1 - e^(-t / tau)), tau = R * C",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Pulso escalón"},
                               {"type": "res", "valor": 2200, "de": "6b", "a": "10b", "etiqueta": "R_tau (2.2 kΩ)"},
                               {"type": "led", "color": "#e33", "de": "10c", "a": "14c", "etiqueta": "Indicador óptico / Carga"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND"}],
                "expected": "Al tiempo t = tau el condensador alcanza el 63.2% de la tensión final.",
                "troubleshooting": "Verificar la polaridad de condensadores electrolíticos para evitar sobrepresión."
            },
            {
                "title": "Respuesta Transitoria de Circuitos RL",
                "objectives": "Analizar la constante de tiempo inductiva tau = L / R y la fem autoinducida.",
                "equations": "i_L(t) = I_max * (1 - e^(-t / (L/R)))",
                "components": [{"type": "wire", "color": "#d22", "de": "p2", "a": "5a", "etiqueta": "Línea DC con conmutación"},
                               {"type": "res", "valor": 330, "de": "5b", "a": "9b", "etiqueta": "R_amortiguación (330 Ω)"},
                               {"type": "res", "valor": 220, "de": "9c", "a": "13c", "etiqueta": "R_bobina equivalente"},
                               {"type": "wire", "color": "#111", "de": "13e", "a": "m13", "etiqueta": "Retorno GND"}],
                "expected": "La inductancia se opone a cambios bruscos de corriente.",
                "troubleshooting": "Cuidado con picos inductivos inversos de alto voltaje al desconectar."
            },
            {
                "title": "Impedancia Compleja y Fasores en Régimen Sinusoidal",
                "objectives": "Comprobar relaciones fasoriales de tensión y corriente en impedancias Z = R + jX.",
                "equations": "Z = |Z| /_ theta, V = I * Z",
                "components": [{"type": "wire", "color": "#d22", "de": "p4", "a": "7a", "etiqueta": "Señal AC sinusoidal"},
                               {"type": "res", "valor": 1000, "de": "7b", "a": "11b", "etiqueta": "R_referencia (1 kΩ)"},
                               {"type": "res", "valor": 2200, "de": "11c", "a": "15c", "etiqueta": "Z_compleja equivalente"},
                               {"type": "wire", "color": "#111", "de": "15e", "a": "m15", "etiqueta": "GND de referencia"}],
                "expected": "Desfase angular entre corriente y voltaje medido en osciloscopio.",
                "troubleshooting": "Sincronizar el trigger del osciloscopio en el canal de tensión de entrada."
            },
            {
                "title": "Resonancia Serie RLC y Factor de Calidad (Q)",
                "objectives": "Identificar la frecuencia de resonancia f_0 = 1 / (2*pi*sqrt(L*C)) y ancho de banda.",
                "equations": "w_0 = 1/sqrt(LC), Q = w_0 * L / R = f_0 / BW",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Generador de barrido f"},
                               {"type": "res", "valor": 220, "de": "6b", "a": "10b", "etiqueta": "R_Q (220 Ω)"},
                               {"type": "led", "color": "#3c3", "de": "10c", "a": "14c", "etiqueta": "Detector de resonancia"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND"}],
                "expected": "Impedancia mínima puramente resistiva a la frecuencia de resonancia.",
                "troubleshooting": "A frecuencias elevadas, las capacidades parásitas del protoboard reducen f_0."
            }
        ]
    },
    {
        "level": 2,
        "name": "Nivel 2 — Electrónica Analógica y Semiconductores",
        "audience": "Ingeniería Eléctrica y Electrónica (Pregrado Avanzado)",
        "labs": [
            {
                "title": "Curva Característica I-V del Diodo p-n y Resistencia Dinámica",
                "objectives": "Determinar la tensión de corte V_gamma y la resistencia dinámica r_d = dV/dI.",
                "equations": "I_D = I_S * (e^(V_D / (n*V_T)) - 1), r_d = 26mV / I_D",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Fuente Vcc variable"},
                               {"type": "res", "valor": 330, "de": "6b", "a": "10b", "etiqueta": "R_limitadora (330 Ω)"},
                               {"type": "led", "color": "#e33", "de": "10c", "a": "14c", "etiqueta": "Diodo Silicio / LED"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "Retorno a GND"}],
                "expected": "V_gamma ~ 0.7V en Si, ~1.8V en LED rojo.",
                "troubleshooting": "Polarización inversa excesiva puede superar la tensión de ruptura zener."
            },
            {
                "title": "Rectificador de Media Onda y Onda Completa con Filtro Capacitivo",
                "objectives": "Evaluar factor de rizado r = V_ac_rms / V_dc y tiempo de conducción de diodos.",
                "equations": "V_dc = V_peak - (I_dc / (2*f*C)), r = 1 / (2*sqrt(3)*f*R*C)",
                "components": [{"type": "wire", "color": "#d22", "de": "p2", "a": "5a", "etiqueta": "Secundario transformador"},
                               {"type": "led", "color": "#e33", "de": "5b", "a": "9b", "etiqueta": "Diodo rectificador"},
                               {"type": "res", "valor": 1000, "de": "9c", "a": "13c", "etiqueta": "R_carga (1 kΩ)"},
                               {"type": "wire", "color": "#111", "de": "13e", "a": "m13", "etiqueta": "Referencia central"}],
                "expected": "Tensión continua regulada con rizado inversamente proporcional a C.",
                "troubleshooting": "Verificar la corriente pico repetitiva en los diodos durante el encendido."
            },
            {
                "title": "Regulador de Voltaje con Diodo Zener",
                "objectives": "Analizar regulación de línea (dVo/dVin) y regulación de carga (dVo/dIL).",
                "equations": "V_out = V_Z, I_Z = (V_in - V_Z)/R_S - I_L",
                "components": [{"type": "wire", "color": "#d22", "de": "p4", "a": "7a", "etiqueta": "V_in no regulada"},
                               {"type": "res", "valor": 330, "de": "7b", "a": "11b", "etiqueta": "R_serie (330 Ω)"},
                               {"type": "led", "color": "#3c3", "de": "11c", "a": "15c", "etiqueta": "Zener de regulación"},
                               {"type": "wire", "color": "#111", "de": "15e", "a": "m15", "etiqueta": "GND"}],
                "expected": "V_out constante ante fluctuaciones de V_in superiores a V_Z.",
                "troubleshooting": "Si I_Z cae bajo la corriente de codo (I_Zk), se pierde la regulación."
            },
            {
                "title": "Polarización del Transistor BJT por Divisor de Tensión",
                "objectives": "Establecer un punto Q estable e independiente de las variaciones térmicas de beta.",
                "equations": "V_TH = V_CC * R2/(R1+R2), I_C = (V_TH - V_BE) / (R_TH/beta + R_E)",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "V_CC 12V"},
                               {"type": "res", "valor": 2200, "de": "6b", "a": "10b", "etiqueta": "R_colector (2.2 kΩ)"},
                               {"type": "led", "color": "#e33", "de": "10c", "a": "14c", "etiqueta": "BJT Canal activo"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND"}],
                "expected": "V_CE_Q en la mitad de la recta de carga estática para máxima excursión simétrica.",
                "troubleshooting": "Cálculo de R_TH <= 0.1 * beta * R_E para inmunidad frente a dispersión de h_fe."
            },
            {
                "title": "Amplificador BJT en Emisor Común (Pequeña Señal)",
                "objectives": "Calcular y medir la ganancia de tensión A_v, impedancia de entrada Z_in y salida Z_out.",
                "equations": "A_v = -g_m * (R_C || R_L), g_m = I_CQ / V_T",
                "components": [{"type": "wire", "color": "#d22", "de": "p4", "a": "7a", "etiqueta": "Entrada v_in ac"},
                               {"type": "res", "valor": 1000, "de": "7b", "a": "11b", "etiqueta": "R_base (1 kΩ)"},
                               {"type": "res", "valor": 2200, "de": "11c", "a": "15c", "etiqueta": "R_colector (2.2 kΩ)"},
                               {"type": "wire", "color": "#111", "de": "15e", "a": "m15", "etiqueta": "GND"}],
                "expected": "Inversión de fase de 180° y amplificación de pequeña señal (|A_v| > 15).",
                "troubleshooting": "Saturación o corte observado en la cresta si la señal de entrada excede 20 mV_pp."
            },
            {
                "title": "Seguidor de Emisor BJT (Colector Común)",
                "objectives": "Comprobar amplificación de corriente unitaria de tensión e impedancia de entrada muy alta.",
                "equations": "A_v ~ 1, Z_in ~ beta * (r_e + R_E), Z_out ~ r_e + R_B/beta",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Señal analógica de alta impedancia"},
                               {"type": "res", "valor": 1000, "de": "6b", "a": "10b", "etiqueta": "R_polarización (1 kΩ)"},
                               {"type": "res", "valor": 330, "de": "10c", "a": "14c", "etiqueta": "R_emisor de carga (330 Ω)"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND"}],
                "expected": "Adaptador de impedancias idóneo para etapas de salida.",
                "troubleshooting": "Distorsión de cruce si la excursión negativa excede el potencial de emisor continuo."
            },
            {
                "title": "Polarización y Conmutación de MOSFETs de Canal N",
                "objectives": "Evaluar la transconductancia g_fs y la resistencia de conducción R_DS(on).",
                "equations": "I_D = 0.5 * mu_n * C_ox * (W/L) * (V_GS - V_th)^2",
                "components": [{"type": "wire", "color": "#d22", "de": "p5", "a": "8a", "etiqueta": "Línea de potencia 12V"},
                               {"type": "res", "valor": 330, "de": "8b", "a": "12b", "etiqueta": "Carga resistiva de potencia"},
                               {"type": "led", "color": "#3c3", "de": "12c", "a": "16c", "etiqueta": "MOSFET N-Channel"},
                               {"type": "wire", "color": "#111", "de": "16e", "a": "m16", "etiqueta": "Source a GND"}],
                "expected": "Corriente de compuerta nula en régimen estacionario (I_G = 0).",
                "troubleshooting": "Proteger el gate con diodo zener contra descargas electrostáticas (ESD)."
            },
            {
                "title": "Amplificador Operacional: Configuraciones Inversora y No Inversora",
                "objectives": "Comprobar el concepto de cortocircuito virtual (V+ = V-) y ganancia en lazo cerrado.",
                "equations": "A_inv = -R_f / R_in, A_no_inv = 1 + R_f / R_in",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Entrada de señal analógica"},
                               {"type": "res", "valor": 1000, "de": "6b", "a": "10b", "etiqueta": "R_in (1 kΩ)"},
                               {"type": "res", "valor": 2200, "de": "10c", "a": "14c", "etiqueta": "R_feedback (2.2 kΩ)"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND"}],
                "expected": "Ganancia teórica inversora A_v = -2.2, ancho de banda limitado por GBP.",
                "troubleshooting": "Saturación a los rieles de alimentación si |A_v * v_in| > V_supply."
            },
            {
                "title": "Sumador Ponderado y Restador Diferencial con Op-Amp",
                "objectives": "Implementar operaciones matemáticas analógicas y calcular el rechazo en modo común (CMRR).",
                "equations": "V_out = -( (R_f/R1)*V1 + (R_f/R2)*V2 ), CMRR = |A_d / A_cm|",
                "components": [{"type": "wire", "color": "#d22", "de": "p2", "a": "5a", "etiqueta": "Canal analógico V1"},
                               {"type": "res", "valor": 1000, "de": "5b", "a": "9b", "etiqueta": "R_entrada 1 (1 kΩ)"},
                               {"type": "res", "valor": 1000, "de": "9c", "a": "13c", "etiqueta": "R_entrada 2 (1 kΩ)"},
                               {"type": "wire", "color": "#111", "de": "13e", "a": "m13", "etiqueta": "GND"}],
                "expected": "Combinación lineal precisa de las señales analógicas de entrada.",
                "troubleshooting": "El desbalance en resistencias del restador degrada drásticamente el CMRR."
            },
            {
                "title": "Filtro Activo Pasa-Bajos Sallen-Key de Segundo Orden",
                "objectives": "Diseñar y verificar la respuesta en frecuencia Butterworth con caída de -40 dB/década.",
                "equations": "f_c = 1 / (2*pi*sqrt(R1*R2*C1*C2)), Q = 0.707 (Butterworth)",
                "components": [{"type": "wire", "color": "#d22", "de": "p4", "a": "7a", "etiqueta": "Generador de barrido de frecuencia"},
                               {"type": "res", "valor": 1000, "de": "7b", "a": "11b", "etiqueta": "R1 de filtrado (1 kΩ)"},
                               {"type": "res", "valor": 1000, "de": "11c", "a": "15c", "etiqueta": "R2 de filtrado (1 kΩ)"},
                               {"type": "wire", "color": "#111", "de": "15e", "a": "m15", "etiqueta": "GND"}],
                "expected": "Atenuación de 3 dB en la frecuencia de corte f_c y respuesta plana en banda pasante.",
                "troubleshooting": "Oscilaciones parasitarias si la ganancia en lazo cerrado excede 3."
            }
        ]
    },
    {
        "level": 3,
        "name": "Nivel 3 — Electrónica Digital y Sistemas Secuenciales",
        "audience": "Ingeniería Eléctrica y Electrónica (Pregrado Avanzado)",
        "labs": [
            {
                "title": "Compuertas Lógicas Fundamentales y Teoremas de De Morgan",
                "objectives": "Verificar tablas de verdad de NAND, NOR, XOR y optimización mediante álgebra booleana.",
                "equations": "not(A and B) = not(A) or not(B), not(A or B) = not(A) and not(B)",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Lógica Vcc 5V (Nivel 1)"},
                               {"type": "res", "valor": 330, "de": "6b", "a": "10b", "etiqueta": "R_pull-down (330 Ω)"},
                               {"type": "led", "color": "#3c3", "de": "10c", "a": "14c", "etiqueta": "Indicador lógico de salida"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND"}],
                "expected": "Niveles lógicos TTL: V_IL < 0.8V, V_IH > 2.0V.",
                "troubleshooting": "Pines de entrada flotantes en CMOS causan consumos espurios y estados erráticos."
            },
            {
                "title": "Decodificador BCD a 7 Segmentos y Multiplexado Temporal",
                "objectives": "Construir la decodificación de 4 bits para displays de cátodo/ánodo común.",
                "equations": "f(A,B,C,D) sintetizado con mapas de Karnaugh.",
                "components": [{"type": "wire", "color": "#d22", "de": "p2", "a": "5a", "etiqueta": "Bus BCD de entrada"},
                               {"type": "res", "valor": 330, "de": "5b", "a": "9b", "etiqueta": "Array limitador segmento A-G"},
                               {"type": "led", "color": "#e33", "de": "9c", "a": "13c", "etiqueta": "Segmento display 7-seg"},
                               {"type": "wire", "color": "#111", "de": "13e", "a": "m13", "etiqueta": "Cátodo común a tierra"}],
                "expected": "Representación correcta de dígitos hexadecimales 0-9 y A-F.",
                "troubleshooting": "Verificar polaridad si los segmentos no encienden (ánodo vs cátodo común)."
            },
            {
                "title": "Multiplexores y Demultiplexores (Rutas de Datos Digitales)",
                "objectives": "Sintetizar funciones lógicas arbitrarias empleando multiplexores 4:1 y 8:1.",
                "equations": "Y = S1' * S0' * D0 + S1' * S0 * D1 + S1 * S0' * D2 + S1 * S0 * D3",
                "components": [{"type": "wire", "color": "#d22", "de": "p4", "a": "7a", "etiqueta": "Líneas de selección S0/S1"},
                               {"type": "res", "valor": 1000, "de": "7b", "a": "11b", "etiqueta": "Resistencias de selección"},
                               {"type": "led", "color": "#3c3", "de": "11c", "a": "15c", "etiqueta": "Salida multiplexada"},
                               {"type": "wire", "color": "#111", "de": "15e", "a": "m15", "etiqueta": "GND"}],
                "expected": "Encaminamiento de datos con retardo de propagación t_pd < 15 ns.",
                "troubleshooting": "Glitches transitorios por retardos asimétricos en el decodificador de líneas."
            },
            {
                "title": "Comparador de Magnitud Digital y Unidad Aritmética Elemental",
                "objectives": "Diseñar comparadores de 4 bits (A>B, A=B, A<B) y sumadores completos (Full Adder).",
                "equations": "S = A xor B xor Cin, Cout = (A and B) or (Cin and (A xor B))",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Entrada binaria A y B"},
                               {"type": "res", "valor": 330, "de": "6b", "a": "10b", "etiqueta": "R_suma (330 Ω)"},
                               {"type": "led", "color": "#e33", "de": "10c", "a": "14c", "etiqueta": "Acarreo de salida C_out"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND"}],
                "expected": "Cálculo aritmético binario instantáneo con propagación de acarreo.",
                "troubleshooting": "El acarreo en cascada (Ripple Carry) acumula retardo proporcional a n bits."
            },
            {
                "title": "Biestables (Flip-Flops D, JK y T) y Tiempos de Setup/Hold",
                "objectives": "Caracterizar disparo por flanco, tiempo de establecimiento (t_su) y retención (t_h).",
                "equations": "Q(t+1) = D, Q_JK(t+1) = J * not(Q) + not(K) * Q",
                "components": [{"type": "wire", "color": "#d22", "de": "p4", "a": "7a", "etiqueta": "Señal de reloj CLK"},
                               {"type": "btn", "de": "7b", "a": "11b", "etiqueta": "Pulsador de reloj manual (Anti-rebote)"},
                               {"type": "led", "color": "#3c3", "de": "11c", "a": "15c", "etiqueta": "Estado Q del Flip-Flop"},
                               {"type": "wire", "color": "#111", "de": "15e", "a": "m15", "etiqueta": "GND"}],
                "expected": "Transición sincrónica exclusivamente en el flanco activo del reloj.",
                "troubleshooting": "Rebotes mecánicos en pulsadores causan múltiples pulsos de reloj espurios."
            },
            {
                "title": "Contadores Asíncronos (Ripple) y Síncronos Binarios",
                "objectives": "Construir contadores módulo 10 (década) y módulo 16 con reset sincrónico y asincrónico.",
                "equations": "Modulo = 2^N - estados descartados.",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Tren de pulsos de reloj"},
                               {"type": "res", "valor": 330, "de": "6b", "a": "10b", "etiqueta": "R_limitación bus"},
                               {"type": "led", "color": "#e33", "de": "10c", "a": "14c", "etiqueta": "Bit de peso Q0-Q3"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND"}],
                "expected": "Secuencia binaria ascendente 0000 -> 1111 y ciclo repetitivo.",
                "troubleshooting": "En contadores asíncronos el retardo acumulado genera estados transitorios falsos."
            },
            {
                "title": "Registros de Desplazamiento (SISO, SIPO, PISO, PIPO)",
                "objectives": "Implementar conversión serie-paralelo y registros universales bidireccionales.",
                "equations": "D_i -> Q_i -> D_i+1 secuenciado por CLK.",
                "components": [{"type": "wire", "color": "#d22", "de": "p2", "a": "5a", "etiqueta": "Dato serie de entrada"},
                               {"type": "res", "valor": 330, "de": "5b", "a": "9b", "etiqueta": "R_bus (330 Ω)"},
                               {"type": "led", "color": "#3c3", "de": "9c", "a": "13c", "etiqueta": "Bit paralelo de salida"},
                               {"type": "wire", "color": "#111", "de": "13e", "a": "m13", "etiqueta": "GND"}],
                "expected": "Propagación ordenada de datos digitales en cada ciclo de reloj.",
                "troubleshooting": "Verificar que el reloj distribuido llegue en fase a todos los flip-flops (Clock Skew)."
            },
            {
                "title": "Máquinas de Estado Finito (FSM) Tipo Mealy y Moore",
                "objectives": "Diseñar e implementar un detector de secuencias binarias (p. ej. 1011) en hardware discreto.",
                "equations": "Moore: Out = g(State), Mealy: Out = g(State, In)",
                "components": [{"type": "wire", "color": "#d22", "de": "p4", "a": "7a", "etiqueta": "Línea de entrada de secuencia"},
                               {"type": "res", "valor": 1000, "de": "7b", "a": "11b", "etiqueta": "Lógica de siguiente estado"},
                               {"type": "led", "color": "#e33", "de": "11c", "a": "15c", "etiqueta": "Indicador de secuencia detectada"},
                               {"type": "wire", "color": "#111", "de": "15e", "a": "m15", "etiqueta": "GND"}],
                "expected": "Transición rigurosa de estados sin bloqueos en estados inalcanzables.",
                "troubleshooting": "Asignar siempre código seguro de reset para recuperar el estado inicial."
            },
            {
                "title": "Convertidor Digital a Analógico (DAC tipo Escalera R-2R)",
                "objectives": "Diseñar red resistiva R-2R y medir linealidad integral (INL) y diferencial (DNL).",
                "equations": "V_out = -V_ref * sum(b_i * 2^(-i))",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Bits binarios b0..b3"},
                               {"type": "res", "valor": 1000, "de": "6b", "a": "10b", "etiqueta": "Rama R (1 kΩ)"},
                               {"type": "res", "valor": 2200, "de": "10c", "a": "14c", "etiqueta": "Rama 2R (2.2 kΩ aprox)"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND analógica"}],
                "expected": "Escalón analógico proporcional exacto a cada incremento binario.",
                "troubleshooting": "Tolerancias resistivas del 5% provocan no-monotonía y saltos irregulares."
            },
            {
                "title": "Convertidor Analógico a Digital (ADC Flash y Aproximaciones Sucesivas)",
                "objectives": "Comprender cuantización, error de cuantización Q = V_ref / 2^N y teorema de Nyquist.",
                "equations": "f_muestreo >= 2 * f_max, SNR = 6.02 * N + 1.76 dB",
                "components": [{"type": "wire", "color": "#d22", "de": "p4", "a": "7a", "etiqueta": "Voltaje analógico v_in"},
                               {"type": "res", "valor": 330, "de": "7b", "a": "11b", "etiqueta": "Divisor de umbrales comparadores"},
                               {"type": "led", "color": "#3c3", "de": "11c", "a": "15c", "etiqueta": "Bit de cuantización MSB"},
                               {"type": "wire", "color": "#111", "de": "15e", "a": "m15", "etiqueta": "GND"}],
                "expected": "Palabra binaria representativa del nivel de tensión analógico continuo.",
                "troubleshooting": "Introducir filtro antialiasing previo para evitar solapamiento espectral."
            }
        ]
    },
    {
        "level": 4,
        "name": "Nivel 4 — Señales, Control y Electrónica de Potencia",
        "audience": "Ingeniería Eléctrica y Electrónica (Pregrado Avanzado)",
        "labs": [
            {
                "title": "Acondicionamiento de Señal: Filtros de Muestreo y Ganancia Variable",
                "objectives": "Acondicionar señales de bajo nivel (milivoltios) provenientes de transductores industriales.",
                "equations": "V_out = A_v * (V_in + V_offset)",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Señal del sensor con ruido"},
                               {"type": "res", "valor": 1000, "de": "6b", "a": "10b", "etiqueta": "R_amplificación (1 kΩ)"},
                               {"type": "res", "valor": 2200, "de": "10c", "a": "14c", "etiqueta": "Filtro paso-bajo (2.2 kΩ)"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND limpia"}],
                "expected": "Relación señal a ruido (SNR) incrementada significativamente.",
                "troubleshooting": "Evitar bucles de tierra (Ground Loops) que acoplan armónicos de red a 60 Hz."
            },
            {
                "title": "Disparo y Control de Ángulo de Fase con SCR y TRIAC",
                "objectives": "Analizar control de potencia AC mediante modulación por ángulo de disparo alfa.",
                "equations": "V_rms = V_m * sqrt( (1/pi) * (pi - alfa + 0.5*sin(2*alfa)) )",
                "components": [{"type": "wire", "color": "#d22", "de": "p2", "a": "5a", "etiqueta": "Fase AC 220V/110V escalada"},
                               {"type": "res", "valor": 1000, "de": "5b", "a": "9b", "etiqueta": "R_red RC de retardo de fase"},
                               {"type": "led", "color": "#e33", "de": "9c", "a": "13c", "etiqueta": "Gate de disparo / DIAC"},
                               {"type": "wire", "color": "#111", "de": "13e", "a": "m13", "etiqueta": "Neutro de retorno"}],
                "expected": "Regulación eficaz de potencia entregada a una carga resistiva o luminosa.",
                "troubleshooting": "Cargas inductivas requieren circuito de amortiguación (Snubber RC) por dv/dt."
            },
            {
                "title": "Generador de Modulación por Ancho de Pulsos (PWM)",
                "objectives": "Diseñar modulador PWM con comparador y rampa triangular para control de actuadores.",
                "equations": "Duty_Cycle = T_on / T_period * 100%, V_promedio = D * V_max",
                "components": [{"type": "wire", "color": "#d22", "de": "p4", "a": "7a", "etiqueta": "Onda rampa portadora"},
                               {"type": "res", "valor": 330, "de": "7b", "a": "11b", "etiqueta": "Tensión de control modulante"},
                               {"type": "led", "color": "#3c3", "de": "11c", "a": "15c", "etiqueta": "Tren de pulsos modulados PWM"},
                               {"type": "wire", "color": "#111", "de": "15e", "a": "m15", "etiqueta": "GND"}],
                "expected": "Variación lineal de duty cycle de 0% a 100% proporcional a la señal de control.",
                "troubleshooting": "Pérdidas de conmutación en transistores si los flancos de subida son lentos."
            },
            {
                "title": "Convertidor DC-DC Reductor (Buck Converter)",
                "objectives": "Calcular y medir eficiencia energética, rizado de inductor Delta_IL y modo CCM/DCM.",
                "equations": "V_out = D * V_in, Delta_I_L = (V_in - V_out)*D / (f_sw * L)",
                "components": [{"type": "wire", "color": "#d22", "de": "p5", "a": "8a", "etiqueta": "V_in 12V DC"},
                               {"type": "res", "valor": 330, "de": "8b", "a": "12b", "etiqueta": "Switching MOSFET + Diodo Schottky"},
                               {"type": "res", "valor": 220, "de": "12c", "a": "16c", "etiqueta": "Filtro LC de salida (L=100uH)"},
                               {"type": "wire", "color": "#111", "de": "16e", "a": "m16", "etiqueta": "GND de potencia"}],
                "expected": "Eficiencia superior al 85% con tensión de salida V_out = 5.0 V estable.",
                "troubleshooting": "El diodo de marcha libre debe ser ultra-rápido (Schottky) para minimizar trr."
            },
            {
                "title": "Convertidor DC-DC Elevador (Boost Converter)",
                "objectives": "Analizar la transferencia de energía reactiva en inductancias y relación de elevación.",
                "equations": "V_out = V_in / (1 - D), D_max teórico limitado por parásitas",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "V_in baja tensión (3.3V / 5V)"},
                               {"type": "res", "valor": 220, "de": "6b", "a": "10b", "etiqueta": "Inductor de almacenamiento L"},
                               {"type": "led", "color": "#e33", "de": "10c", "a": "14c", "etiqueta": "V_out elevada (> 12V)"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND"}],
                "expected": "Tensión de salida superior a la de entrada regulada mediante realimentación.",
                "troubleshooting": "Nunca operar un Boost sin carga conectada; la tensión puede sobrepasar el breakdown del capacitor."
            },
            {
                "title": "Driver de Potencia en Puente H (H-Bridge) para Motores DC",
                "objectives": "Controlar sentido de giro bidireccional y frenado regenerativo con lógica shoot-through protection.",
                "equations": "Torque = K_t * I_armadura, V_bemf = K_e * omega",
                "components": [{"type": "wire", "color": "#d22", "de": "p4", "a": "7a", "etiqueta": "V_motor 12V DC"},
                               {"type": "res", "valor": 330, "de": "7b", "a": "11b", "etiqueta": "Resistencias de gate superiores"},
                               {"type": "res", "valor": 330, "de": "11c", "a": "15c", "etiqueta": "Resistencias de gate inferiores"},
                               {"type": "wire", "color": "#111", "de": "15e", "a": "m15", "etiqueta": "GND"}],
                "expected": "Conducción en diagonal alternada sin conducción simultánea (Dead-time insertion).",
                "troubleshooting": "El fenómeno shoot-through (conducción cruzada vertical) destruye los transistores."
            },
            {
                "title": "Aislamiento Galvánico y Optoacopladores",
                "objectives": "Garantizar inmunidad ante transitorios y protección de la lógica de baja tensión.",
                "equations": "CTR = I_C / I_F * 100%, Aislamiento típico > 2500 V_rms",
                "components": [{"type": "wire", "color": "#d22", "de": "p2", "a": "5a", "etiqueta": "Lado digital de control"},
                               {"type": "res", "valor": 330, "de": "5b", "a": "9b", "etiqueta": "R_anodo opto (330 Ω)"},
                               {"type": "led", "color": "#3c3", "de": "9c", "a": "13c", "etiqueta": "Optoacoplador 4N35 / PC817"},
                               {"type": "wire", "color": "#111", "de": "13e", "a": "m13", "etiqueta": "GND de control (separada de potencia)"}],
                "expected": "Transmisión limpia de señales con rechazo a modo común (CMRR) infinito en DC.",
                "troubleshooting": "Mantener físicamente separadas las pistas de GND digital y GND de potencia."
            },
            {
                "title": "Control Proporcional-Integral (PI) Analógico en Lazo Cerrado",
                "objectives": "Implementar un controlador de posición o velocidad analógico con amplificadores operacionales.",
                "equations": "u(t) = K_p * e(t) + K_i * integral(e(tau) dtau)",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Referencia Setpoint"},
                               {"type": "res", "valor": 1000, "de": "6b", "a": "10b", "etiqueta": "R_proporcional Kp (1 kΩ)"},
                               {"type": "res", "valor": 2200, "de": "10c", "a": "14c", "etiqueta": "R_integrador Ki (2.2 kΩ)"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND"}],
                "expected": "Error en estado estacionario nulo (e_ss = 0) ante entrada escalón.",
                "troubleshooting": "Saturación del integrador (Windup) requiere limitador de excursión en el lazo."
            },
            {
                "title": "Osciladores Senoidales: Puente de Wien y Control de Amplitud",
                "objectives": "Verificar el criterio de oscilación de Barkhausen (|A*beta| = 1, fase = 0°).",
                "equations": "f_osc = 1 / (2*pi*R*C), Ganancia requerida A_v = 3",
                "components": [{"type": "wire", "color": "#d22", "de": "p4", "a": "7a", "etiqueta": "Lazo de realimentación positiva"},
                               {"type": "res", "valor": 1000, "de": "7b", "a": "11b", "etiqueta": "R1 red de Wien (1 kΩ)"},
                               {"type": "res", "valor": 1000, "de": "11c", "a": "15c", "etiqueta": "R2 red de Wien (1 kΩ)"},
                               {"type": "wire", "color": "#111", "de": "15e", "a": "m15", "etiqueta": "GND"}],
                "expected": "Onda senoidal pura de muy baja distorsión armónica total (THD < 0.5%).",
                "troubleshooting": "Si la ganancia es menor a 3 la oscilación decae; si es mayor, la señal se recorta a onda cuadrada."
            },
            {
                "title": "Comparador con Histéresis (Trigger de Schmitt)",
                "objectives": "Eliminar falsos disparos causados por ruido mediante umbrales superior (V_TH) e inferior (V_TL).",
                "equations": "V_TH = V_sat * R1 / (R1+R2), V_TL = -V_sat * R1 / (R1+R2)",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Entrada ruidosa v_in"},
                               {"type": "res", "valor": 1000, "de": "6b", "a": "10b", "etiqueta": "R1 de realimentación positiva"},
                               {"type": "res", "valor": 2200, "de": "10c", "a": "14c", "etiqueta": "R2 divisora de histéresis"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND"}],
                "expected": "Transiciones digitales limpias e inmunes al ruido de entrada en la zona de banda muerta.",
                "troubleshooting": "Asegurar que la realimentación ingrese al pin no inversor (V+) del operacional."
            }
        ]
    },
    {
        "level": 5,
        "name": "Nivel 5 — Electrónica Avanzada, Interfaces y Sistemas Embebidos",
        "audience": "Ingeniería Eléctrica y Electrónica (Pregrado Avanzado)",
        "labs": [
            {
                "title": "Amplificador de Instrumentación de Tres Op-Amps",
                "objectives": "Medir bio-potenciales y señales de puente Wheatstone con CMRR superior a 100 dB.",
                "equations": "A_diff = (1 + 2*R1/R_gain) * (R3/R2)",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Electrodo / Sensor Entrada +"},
                               {"type": "wire", "color": "#ea0", "de": "p4", "a": "7a", "etiqueta": "Electrodo / Sensor Entrada -"},
                               {"type": "res", "valor": 220, "de": "6b", "a": "10b", "etiqueta": "R_gain externa (220 Ω)"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "Pierna derecha / GND común"}],
                "expected": "Amplificación lineal de microvoltios rechazando voltajes de modo común de varios voltios.",
                "troubleshooting": "Emparejar resistencias R2 y R3 al 0.1% para no degradar el CMRR del tercer amplificador."
            },
            {
                "title": "Acondicionamiento para Celda de Carga y Puente de Wheatstone",
                "objectives": "Compensación de temperatura y calibración de offset en galgas extensométricas.",
                "equations": "Delta_V = V_ex * (Delta_R / (4*R_0))",
                "components": [{"type": "wire", "color": "#d22", "de": "p2", "a": "5a", "etiqueta": "V_excitación precisa"},
                               {"type": "res", "valor": 1000, "de": "5b", "a": "9b", "etiqueta": "Brazo 1 Galga (1 kΩ)"},
                               {"type": "res", "valor": 1000, "de": "9c", "a": "13c", "etiqueta": "Brazo 2 Compensación (1 kΩ)"},
                               {"type": "wire", "color": "#111", "de": "13e", "a": "m13", "etiqueta": "GND"}],
                "expected": "Salida proporcional a la deformación mecánica (Strain gauge).",
                "troubleshooting": "Cables largos introducen resistencia serie; emplear sensado a 4 hilos (Kelvin)."
            },
            {
                "title": "Lazo de Seguimiento de Fase (PLL) y Sintetizador de Frecuencia",
                "objectives": "Estudiar detector de fase, filtro de lazo y oscilador controlado por voltaje (VCO).",
                "equations": "f_out = N * f_ref, Rango de captura Delta_f_c y enganche Delta_f_L",
                "components": [{"type": "wire", "color": "#d22", "de": "p4", "a": "7a", "etiqueta": "Señal de referencia externa"},
                               {"type": "res", "valor": 1000, "de": "7b", "a": "11b", "etiqueta": "R_filtro de lazo (1 kΩ)"},
                               {"type": "led", "color": "#3c3", "de": "11c", "a": "15c", "etiqueta": "VCO Output / Pin Lock detect"},
                               {"type": "wire", "color": "#111", "de": "15e", "a": "m15", "etiqueta": "GND"}],
                "expected": "Sincronización en fase y multiplicación de frecuencia exacta.",
                "troubleshooting": "Jitter excesivo si el filtro pasabajos de lazo no atenúa suficientemente los armónicos de comparación."
            },
            {
                "title": "Interfaz de Bus I2C: Protocolo Físico y Pull-up Resistance",
                "objectives": "Analizar la línea bidireccional Open-Drain SDA/SCL, capacitancia de bus y tiempos de subida.",
                "equations": "t_r = 0.8473 * R_pullup * C_bus, R_min = (Vcc - V_OL) / I_OL",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Línea Vcc 3.3V"},
                               {"type": "res", "valor": 2200, "de": "6b", "a": "10b", "etiqueta": "R_pullup SDA (2.2 kΩ)"},
                               {"type": "res", "valor": 2200, "de": "6d", "a": "10d", "etiqueta": "R_pullup SCL (2.2 kΩ)"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND común"}],
                "expected": "Tiempos de subida conforme al estándar I2C Fast-Mode (< 300 ns).",
                "troubleshooting": "Resistencias pull-up demasiado altas causan redondeo de flancos y errores de ACK."
            },
            {
                "title": "Bus SPI de Alta Velocidad e Integridad de Señal",
                "objectives": "Evaluar líneas MOSI, MISO, SCK y CS con frecuencias de reloj superiores a 20 MHz.",
                "equations": "Z_0 = sqrt(L_line / C_line), Terminación en serie R_term = Z_0 - R_driver",
                "components": [{"type": "wire", "color": "#d22", "de": "p4", "a": "7a", "etiqueta": "Línea de reloj SCK 20MHz"},
                               {"type": "res", "valor": 330, "de": "7b", "a": "11b", "etiqueta": "Resistencia de amortiguamiento serie"},
                               {"type": "led", "color": "#3c3", "de": "11c", "a": "15c", "etiqueta": "Chip Select CS activo en bajo"},
                               {"type": "wire", "color": "#111", "de": "15e", "a": "m15", "etiqueta": "GND de alta frecuencia"}],
                "expected": "Transmisión full-duplex libre de reflexiones y sobreoscilaciones (ringing).",
                "troubleshooting": "Colocar planos de masa continuos bajo las trazas de reloj para minimizar diafonía (crosstalk)."
            },
            {
                "title": "Transmisor Diferencial RS-485 para Entornos Industriales",
                "objectives": "Verificar inmunidad electromagnética mediante señalización diferencial balanceada (A-B).",
                "equations": "V_diff = V_A - V_B, Terminación R_t = 120 Ω",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Alimentación del transceptor 5V"},
                               {"type": "res", "valor": 220, "de": "6b", "a": "10b", "etiqueta": "Resistencia de polarización Fail-Safe"},
                               {"type": "res", "valor": 220, "de": "10c", "a": "14c", "etiqueta": "Terminación de línea (120 Ω nominal)"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND apantallada"}],
                "expected": "Recepción fidedigna con cables de más de 500 metros en presencia de ruido severo.",
                "troubleshooting": "Omitir la resistencia terminadora en los extremos produce reflexiones destructivas."
            },
            {
                "title": "Controlador de Motor Paso a Paso con Microstepping",
                "objectives": "Generar corrientes sinusoidales y cosinusoidales en cuadratura para posicionamiento angular preciso.",
                "equations": "Paso_micro = Paso_entero / 16, I_A = I_max * cos(theta), I_B = I_max * sin(theta)",
                "components": [{"type": "wire", "color": "#d22", "de": "p5", "a": "8a", "etiqueta": "V_motor 24V DC"},
                               {"type": "res", "valor": 330, "de": "8b", "a": "12b", "etiqueta": "Shunt de sensado de corriente (0.1 Ω eq)"},
                               {"type": "led", "color": "#e33", "de": "12c", "a": "16c", "etiqueta": "Bobina bipolar A"},
                               {"type": "wire", "color": "#111", "de": "16e", "a": "m16", "etiqueta": "GND de potencia"}],
                "expected": "Movimiento suave sin resonancia mecánica en bajas revoluciones.",
                "troubleshooting": "Sobrecalentamiento si la corriente en reposo (Hold current) no se reduce al 50%."
            },
            {
                "title": "Adquisición de Datos Multicanal y Procesamiento Digital (DSP)",
                "objectives": "Diseñar filtro digital FIR/IIR embebido para remoción de componentes espurias.",
                "equations": "y[n] = sum(b_k * x[n-k]) - sum(a_k * y[n-k])",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Canal analógico ADC CH0"},
                               {"type": "res", "valor": 1000, "de": "6b", "a": "10b", "etiqueta": "Filtro antialiasing RC"},
                               {"type": "res", "valor": 1000, "de": "10c", "a": "14c", "etiqueta": "Canal analógico ADC CH1"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND analógica"}],
                "expected": "Atenuación espectral de frecuencias interferentes en tiempo real.",
                "troubleshooting": "Evitar desbordamiento aritmético (Overflow) en representaciones de punto fijo Q15."
            },
            {
                "title": "Diseño de Fuente Conmutada Flyback Aislada",
                "objectives": "Diseñar transformador de acoplamiento magnético, cálculo de núcleo y ciclo desmagnetizante.",
                "equations": "V_out = V_in * (N_s / N_p) * (D / (1 - D))",
                "components": [{"type": "wire", "color": "#d22", "de": "p4", "a": "7a", "etiqueta": "Bus DC primario 150V rectificado"},
                               {"type": "res", "valor": 2200, "de": "7b", "a": "11b", "etiqueta": "Snubber RCD primario"},
                               {"type": "led", "color": "#3c3", "de": "11c", "a": "15c", "etiqueta": "Secundario aislado 12V"},
                               {"type": "wire", "color": "#111", "de": "15e", "a": "m15", "etiqueta": "GND secundaria"}],
                "expected": "Aislamiento galvánico y regulación precisa con lazo optoacoplado TL431.",
                "troubleshooting": "La inductancia de dispersión primario-secundario induce sobretensiones destructivas en el MOSFET."
            },
            {
                "title": "Proyecto de Integración de Sistema Electrónico y Diagnóstico Autónomo",
                "objectives": "Integrar sensado, procesamiento, potencia y telemetría con diagnóstico predictivo asistido por IA.",
                "equations": "Disponibilidad A = MTBF / (MTBF + MTTR)",
                "components": [{"type": "wire", "color": "#d22", "de": "p3", "a": "6a", "etiqueta": "Línea de alimentación general"},
                               {"type": "res", "valor": 330, "de": "6b", "a": "10b", "etiqueta": "Etapa de protección y fusibles"},
                               {"type": "res", "valor": 1000, "de": "10c", "a": "14c", "etiqueta": "Bus de telemetría y diagnóstico"},
                               {"type": "wire", "color": "#111", "de": "14e", "a": "m14", "etiqueta": "GND central del sistema"}],
                "expected": "Operación coordinada sin fallas y diagnóstico de estado reportado al tutor inteligente.",
                "troubleshooting": "Auditar el presupuesto térmico total y balance de masas previo a la puesta en marcha."
            }
        ]
    }
]

def generate_curriculum_json():
    all_circuits = []
    circuit_id = 0
    
    for lvl in LEVELS:
        level_num = lvl["level"]
        for idx, lab in enumerate(lvl["labs"]):
            c_dict = {
                "id": circuit_id,
                "nivel": level_num,
                "nivelNombre": lvl["name"],
                "laboratorioNumero": idx + 1,
                "nombre": f"L{level_num}.{idx+1} — {lab['title']}",
                "audiencia": lvl["audience"],
                "objetivos": lab["objectives"],
                "ecuaciones": lab["equations"],
                "descripcion": f"{lab['objectives']} Ecuaciones rectoras: {lab['equations']}",
                "medicionesEsperadas": lab["expected"],
                "diagnosticoResolucion": lab["troubleshooting"],
                "pasos": lab["components"]
            }
            all_circuits.append(c_dict)
            circuit_id += 1

    curriculum_data = {
        "descripcion": "Currículo Universitario de Ingeniería Eléctrica y Electrónica (50 Laboratorios en 5 Niveles)",
        "totalLaboratorios": len(all_circuits),
        "niveles": [
            {"id": 1, "nombre": "Nivel 1 — Análisis Avanzado de Circuitos", "total": 10},
            {"id": 2, "nombre": "Nivel 2 — Electrónica Analógica y Semiconductores", "total": 10},
            {"id": 3, "nombre": "Nivel 3 — Electrónica Digital y Sistemas Secuenciales", "total": 10},
            {"id": 4, "nombre": "Nivel 4 — Señales, Control y Electrónica de Potencia", "total": 10},
            {"id": 5, "nombre": "Nivel 5 — Electrónica Avanzada, Interfaces y Sistemas Embebidos", "total": 10}
        ],
        "codigoColoresResistencias": {
            "220": {"colores": ["Rojo", "Rojo", "Marrón"], "hex": ["#d22", "#d22", "#852"], "texto": "220 Ω"},
            "330": {"colores": ["Naranja", "Naranja", "Marrón"], "hex": ["#f80", "#f80", "#852"], "texto": "330 Ω"},
            "1000": {"colores": ["Marrón", "Negro", "Rojo"], "hex": ["#852", "#111", "#d22"], "texto": "1 kΩ"},
            "2200": {"colores": ["Rojo", "Rojo", "Rojo"], "hex": ["#d22", "#d22", "#d22"], "texto": "2.2 kΩ"}
        },
        "circuitos": all_circuits
    }

    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'curriculo_50_labs.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(curriculum_data, f, indent=2, ensure_ascii=False)
    
    print(f"Generated {len(all_circuits)} university laboratories at: {out_path}")

if __name__ == '__main__':
    generate_curriculum_json()
