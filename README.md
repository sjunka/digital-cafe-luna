# Digital Café Luna · Architecture Decision Brief

Entrega final del Architecture Challenge de **ST1611 Computación en Nube** (Universidad EAFIT): Architecture Decision Brief (40%) y defensa individual (20%), miércoles 4 de noviembre de 2026. Autor: Sergio Alfredo Junca Valero.

- Tablero animado: https://sjunka.github.io/digital-cafe-luna/
- Brief en PDF, 2 páginas: [`brief.pdf`](https://sjunka.github.io/digital-cafe-luna/brief.pdf) (también en [`public/brief.pdf`](public/brief.pdf))

## Qué hay

El Brief responde una pregunta: cómo vender el pico de una campaña sin perder pedidos y sin darle al equipo más operación de la que puede sostener. Tiene cinco decisiones, y cada una sigue la cadena del curso: restricción → decisión → mecanismo → consecuencia → trade-off.

| | Decisión | Restricciones | Evidencia |
|---|---|---|---|
| D1 | Capacidad: no dimensionar para el pico (CloudFront y un ASG de 2 a 6) | R2, R5 | Lab 06 |
| D2 | Resiliencia y datos: no perder pedidos (dos AZ, RDS Multi-AZ) | R1, R3, R4 | Lab 02 |
| D3 | Red y seguridad: una sola puerta (SG encadenados, IAM sin llaves) | R1, R5 | Labs 04 y 05 |
| D4 | Operación: todo como código y alarmas que actúan | R4 | Lab 06 |
| D5 | Modernización: solo lo intermitente, por evento (S3 → Lambda) | R2, R4, R6 | Lab 07 |

El sitio muestra la arquitectura como el tablero mímico de una sala de control: cada escena ilumina la ruta de una decisión y enciende las lámparas de lo que cambia. Hay siete escenas: el problema, una compra y una por decisión.

## Cómo se usa

| Tecla | Acción |
|---|---|
| `→` `←` | paso siguiente y anterior (también un control remoto de presentación) |
| `Espacio` | reproducir o pausar la escena |
| `1` a `7` | ir a una escena |
| `R` | reiniciar la escena |
| `A` | modo adaptación: marcar sobre el tablero qué se mantiene, qué cambia y qué se agrega |
| `F` | pantalla completa |
| `T` | reloj de 10 minutos; `Mayús + T` lo reinicia |
| `?` | atajos |

Cada paso tiene su enlace: `?escena=falla-az&paso=4` abre la caída de una AZ en el paso 4. `?movimiento=reducido` muestra cada paso sin animación, igual que con la preferencia del sistema.

## Desarrollo

```sh
npm install
npm run dev      # servidor local
npm test         # totales de costo, pasos de cada escena y referencias entre decisiones
npm run build    # un solo dist/index.html con JS, CSS y tipografías dentro; luego revisa fugas
npm run pdf      # imprime el Brief con Chrome a public/brief.pdf y exige 2 páginas
npm run deploy   # prueba, compila, imprime y publica dist/ en la rama gh-pages
```

Todo el texto vive en `src/content.ts`: el sitio, el PDF y las escenas leen de ahí, así que no pueden contradecirse. Los totales de costo se suman desde las filas de la tabla. `scripts/check-leaks.mjs` falla si aparece algo que parezca un dato de cuenta AWS (con `LEAKS_FILE=<ruta>` también busca valores concretos).

## Fuentes y alcance

- Caso, guía y rúbrica: material del curso ST1611 (Digital Café Luna es un caso ficticio, no una empresa real).
- Costos: AWS Price List API, us-east-1, consultada el 21 y el 23 de octubre de 2026, con los supuestos de consumo del Brief.
- Evidencia: Labs Evolutivos 01 a 07, corridos en una cuenta propia con cleanup verificado. Lo que los labs no cubren (CloudFront, RDS Multi-AZ, el NAT, la carga real) aparece como prueba propuesta, no como resultado.
- Tipografías con licencia OFL: Barlow Condensed y Barlow Semi Condensed, B612 Mono y DSEG7.
