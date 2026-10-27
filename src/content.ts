// Única fuente del contenido: el sitio, el Brief imprimible y las escenas leen de aquí.

export type Link = 'restriccion' | 'decision' | 'mecanismo' | 'consecuencia' | 'tradeoff'

export const ESLABONES: { id: Link; nombre: string }[] = [
  { id: 'restriccion', nombre: 'Restricción' },
  { id: 'decision', nombre: 'Decisión' },
  { id: 'mecanismo', nombre: 'Mecanismo' },
  { id: 'consecuencia', nombre: 'Consecuencia' },
  { id: 'tradeoff', nombre: 'Trade-off' },
]

export const META = {
  caso: 'Digital Café Luna',
  documento: 'Architecture Decision Brief',
  autor: 'Sergio Alfredo Junca Valero',
  curso: 'ST1611 Computación en Nube',
  universidad: 'Universidad EAFIT',
  fecha: '4 de noviembre de 2026',
  tesis:
    'Vender el pico de la campaña sin perder pedidos y sin darle al equipo más operación de la que puede sostener.',
  pdf: 'brief.pdf',
  repo: 'https://github.com/sjunka/digital-cafe-luna',
}

// 1. Problema y restricciones

export const PROBLEMA =
  'Digital Café Luna prepara una campaña nacional de pocos días con demanda incierta. Hoy compra capacidad antes de conocer la demanda: el pico la satura y el resto del año sobra. Necesita vender en el pico sin perder pedidos ni exponer datos de clientes, con un equipo pequeño y un presupuesto limitado.'

export interface Restriccion {
  id: string
  nombre: string
  exige: string
  decisiones: string[]
}

export const RESTRICCIONES: Restriccion[] = [
  { id: 'R1', nombre: 'Datos de clientes y pedidos', exige: 'Ningún pedido confirmado se pierde; datos privados, cifrados y auditables.', decisiones: ['D2', 'D3'] },
  { id: 'R2', nombre: 'Demanda irregular por la campaña', exige: 'Capacidad que sigue a la demanda, con techo de costo.', decisiones: ['D1', 'D5'] },
  { id: 'R3', nombre: 'Resiliencia', exige: 'Seguir vendiendo si cae una instancia o una zona de disponibilidad (AZ).', decisiones: ['D2'] },
  { id: 'R4', nombre: 'Equipo tecnológico pequeño', exige: 'Pocas piezas que operar: servicios administrados, todo como código y alarmas que actúan.', decisiones: ['D2', 'D4', 'D5'] },
  { id: 'R5', nombre: 'Costos controlados', exige: 'Costo fijo mínimo y justificado; el variable, acotado.', decisiones: ['D1', 'D3'] },
  { id: 'R6', nombre: 'Capacidad de evolución', exige: 'Sumar capacidades, como el inventario, sin rehacer lo que funciona.', decisiones: ['D5'] },
]

export const PRIORIDAD =
  'Cuando chocan, R1 > R2 > R3 > R5: perder un pedido confirmado es peor que una página lenta, y el pico de la campaña es más probable que la caída de una AZ. R4 es un límite: descarto lo que el equipo no pueda operar.'

export const ALCANCE =
  'Web y campaña, pedidos, clientes y reportes. El inventario de las tiendas va en una segunda etapa: en la priorización del caso tiene valor medio y riesgo alto.'

// 2. Arquitectura

export const FIGURA =
  'Arquitectura en us-east-1: la VPC 10.20.0.0/16 del Lab 01 con tres capas en dos AZ, y cada subnet con su CIDR y su ruta. Los números siguen una compra; D1 a D5 marcan dónde actúa cada decisión.'

export const FLUJO = [
  'CloudFront entrega la web desde caché; solo él lee el bucket (OAC).',
  'La llamada a /api pasa al ALB, que solo acepta a CloudFront, y a una EC2 sana.',
  'La app guarda el pedido en RDS; la pasarela confirma el pago con un webhook firmado.',
  'El pedido confirmado deja incoming/<id>.json en S3 y el evento invoca la Lambda.',
]

// 3. Decisiones

export interface Decision {
  id: string
  titulo: string
  restricciones: string[]
  cadena: Record<Link, string>
  descarte: { opcion: string; porque: string }[] // opción en minúscula salvo nombres propios: va a mitad de frase en el PDF
  evidencia: string
  escena: string
}

export const DECISIONES: Decision[] = [
  {
    id: 'D1',
    titulo: 'Capacidad: no dimensionar para el pico',
    restricciones: ['R2', 'R5'],
    cadena: {
      restriccion: 'El pico de la campaña dura pocos días, es incierto y casi todo es contenido estático; el presupuesto no paga capacidad ociosa.',
      decision: 'Absorbo el pico en dos niveles en vez de comprar capacidad fija.',
      mecanismo: 'CloudFront sirve la web desde caché, con S3 privado de origen; la API corre en un Auto Scaling Group de 2 a 6 EC2 con target tracking al 50% de CPU, y la víspera el mínimo sube a 4.',
      consecuencia: 'Lo estático no toca las EC2 y la API crece con la demanda; fuera de campaña pago 2 instancias.',
      tradeoff: 'Ahorro capacidad ociosa (6 EC2 fijas costarían USD 61 más al mes), pero debo vigilar el escalamiento: por encima del techo de 6, la API se degrada.',
    },
    descarte: [
      { opcion: 'capacidad fija para el pico', porque: 'paga el pico todo el mes' },
      { opcion: 'serverless para toda la API', porque: 'exige rediseñar antes de la campaña' },
    ],
    evidencia: 'Lab 06: la alarma de CPU tardó dos periodos de 5 min en dispararse; escalar por métrica toma minutos, por eso el mínimo sube la víspera.',
    escena: 'campana',
  },
  {
    id: 'D2',
    titulo: 'Resiliencia y datos: no perder pedidos',
    restricciones: ['R1', 'R3', 'R4'],
    cadena: {
      restriccion: 'Un pedido confirmado no se puede perder, la venta debe seguir si cae una instancia o una AZ, y el equipo no puede operar réplicas.',
      decision: 'Todo en dos AZ y el estado fuera de las instancias, en RDS PostgreSQL Multi-AZ.',
      mecanismo: 'El ALB envía solo a instancias sanas y el ASG reemplaza las que fallan el health check de tipo ELB; la sesión va en una cookie firmada. RDS copia cada escritura de forma síncrona al standby de la otra AZ y, si falla la primaria, mueve el endpoint.',
      consecuencia: 'Si cae una AZ, la venta sigue en 1 a 2 minutos sin perder pedidos (RPO 0); los backups restauran a cualquier punto de 7 días y se copian a us-east-2.',
      tradeoff: 'Pago USD 26 más al mes que con Single-AZ y 2 instancias siempre encendidas; la base escala en vertical y puede ser el cuello de botella.',
    },
    descarte: [
      { opcion: 'PostgreSQL en EC2', porque: 'el equipo operaría réplica, backups y parches' },
      { opcion: 'DynamoDB', porque: 'obliga a remodelar los datos por patrones de acceso' },
    ],
    evidencia: 'Lab 02: el ALB sacó la instancia terminada en 35 s y el reemplazo atendía a los 2 min 40 s, sin cortar el servicio; con health check de tipo EC2 no habría visto una app colgada.',
    escena: 'falla-az',
  },
  {
    id: 'D3',
    titulo: 'Red y seguridad: una sola puerta',
    restricciones: ['R1', 'R5'],
    cadena: {
      restriccion: 'Hay datos de clientes y pedidos, y todo lo expuesto a Internet es superficie de ataque.',
      decision: 'CloudFront es la única entrada; la app y la base viven en subnets privadas, con salida mínima.',
      mecanismo: 'Cada SG acepta solo a la capa anterior: CloudFront (prefix list) al ALB, el ALB a la app y la app a la base por 5432. Roles IAM mínimos, sin access keys, y token IAM para la base; KMS, ACM y CloudTrail. S3 por gateway endpoint y un solo NAT para parches.',
      consecuencia: 'Nadie llega directo al ALB ni a la base, y llegar no basta: IAM decide qué puede hacer cada rol.',
      tradeoff: 'Más reglas que mantener. Un solo NAT ahorra USD 37 al mes; si cae su AZ, la otra sigue vendiendo, pero sin parches.',
    },
    descarte: [
      { opcion: 'un ALB abierto a Internet', porque: 'sería una segunda puerta sin caché ni filtro' },
      { opcion: 'un NAT por AZ', porque: 'vender no depende del NAT' },
    ],
    evidencia: 'Lab 04: A → B:8080 dio timeout al quitar la regla entre SG. Lab 05: con el mismo rol, GetObject pasó y PutObject dio AccessDenied.',
    escena: 'intruso',
  },
  {
    id: 'D4',
    titulo: 'Operación: todo como código, alarmas que actúan',
    restricciones: ['R4'],
    cadena: {
      restriccion: 'El equipo es pequeño: un cambio manual no se repite igual y una alarma que nadie mira no protege.',
      decision: 'Toda la infraestructura en CloudFormation, y cada alarma con una acción o un responsable.',
      mecanismo: 'Un template por capa (red, datos, app) crea, cambia con change set y borra, también el ambiente de la prueba de carga. El ASG escala solo; 5XX, instancias sanas, RDS, Lambda y presupuesto avisan por SNS al responsable de turno, con runbook.',
      consecuencia: 'Cada cambio es repetible y auditable, y cada señal termina en una acción.',
      tradeoff: 'Cedo portabilidad frente a Terraform, y nada se toca en la consola: lo manual aparece como drift.',
    },
    descarte: [
      { opcion: 'Terraform', porque: 'custodiar el archivo de estado no compensa con una sola nube' },
      { opcion: 'cambios en la consola', porque: 'no se repiten ni se auditan' },
    ],
    evidencia: 'Lab 06: CREATE_COMPLETE en 26 s, update sin reemplazo y delete sin residuos; la alarma llegó a ALARM, pero sin acciones solo informaba.',
    escena: 'operacion',
  },
  {
    id: 'D5',
    titulo: 'Modernización: solo lo intermitente, por evento',
    restricciones: ['R2', 'R4', 'R6'],
    cadena: {
      restriccion: 'Los reportes son intermitentes y de bajo riesgo: no deben competir con la API en el pico ni justificar otro servidor.',
      decision: 'Reportes por evento, S3 ObjectCreated → Lambda; la API, que es continua, sigue en EC2.',
      mecanismo: 'La app escribe incoming/<id>.json y S3 invoca la Lambda de forma asíncrona (filtro incoming/ y .json); la Lambda escribe reports/<fecha>/<id>.json y un log con el mismo id.',
      consecuencia: 'Los reportes no usan las EC2 del pico ni un servidor dedicado, y el patrón sirve para el inventario.',
      tradeoff: 'El evento llega al menos una vez y sin orden: escribir por id evita duplicados. Sumo una ruta de diagnóstico: evento, permiso y log.',
    },
    descarte: [
      { opcion: 'un proceso en las EC2', porque: 'compite con la API en el pico' },
      { opcion: 'una VM dedicada', porque: 'encendida para un trabajo intermitente' },
    ],
    evidencia: 'Lab 07: incoming/order-001.json produjo una invocación y un log con el mismo key; .txt y archive/ no invocaron.',
    escena: 'evento',
  },
]

// 4. Trade-offs, riesgos y supuestos

export const TRADEOFFS = [
  { d: 'D1', gano: 'El pico estático no toca el cómputo', sacrifico: 'Capacidad sobre 6 EC2; frescura de la caché', riesgo: 'Un pico mayor que el supuesto', senal: 'p95 sobre 1 s con el ASG en 6' },
  { d: 'D2', gano: 'Failover sin perder pedidos', sacrifico: 'USD 26 al mes; 2 EC2 siempre encendidas', riesgo: 'La base como cuello de botella; una sola región', senal: 'CPU y conexiones de RDS; ensayo en us-east-2' },
  { d: 'D3', gano: 'Una sola puerta, sin llaves guardadas', sacrifico: 'Un NAT redundante (USD 37 al mes)', riesgo: 'Una policy mal escrita; caída de la AZ del NAT', senal: 'AccessDenied en los logs; AWS Health' },
  { d: 'D4', gano: 'Cambios repetibles y auditables', sacrifico: 'Portabilidad del template', riesgo: 'Un cambio manual fuera del template', senal: 'Detección de drift' },
  { d: 'D5', gano: 'Reportes sin servidor que operar', sacrifico: 'Inmediatez y orden de los eventos', riesgo: 'Un evento que falla tras los reintentos', senal: 'Alarma de errores de la Lambda' },
]

export const RESILIENCIA = [
  { falla: 'Instancia', efecto: 'El ALB la saca y el ASG la repone (Lab 02)', objetivo: 'servicio continuo, RPO 0' },
  { falla: 'AZ', efecto: 'ALB y ASG siguen en la otra; RDS pasa al standby', objetivo: 'RTO 1 a 2 min, RPO 0' },
  { falla: 'Error humano', efecto: 'Restauración de RDS a un punto en el tiempo', objetivo: 'RTO 1 h, RPO 5 min' },
  { falla: 'Región', efecto: 'Backups y templates se restauran en us-east-2', objetivo: 'RTO 4 h, RPO 1 h en us-east-2' },
]

export const SUPUESTOS = [
  { texto: 'El pico es unas 10 veces la carga normal por 3 a 5 días, sobre todo contenido estático.', valida: 'con una prueba de carga y el cache hit ratio' },
  { texto: 'La app es stateless: sesión en cookie firmada, carrito en la base y archivos en S3.', valida: 'terminando una instancia sin perder carritos' },
  { texto: 'El pago es un checkout alojado con webhook: vender no necesita llamadas salientes.', valida: 'con el proveedor; si no, un NAT por AZ (USD 37)' },
  { texto: 'Los datos pueden alojarse en EE. UU. (Ley 1581 de 2012) y el equipo domina Linux y SQL.', valida: 'con el área legal y con el equipo' },
  { texto: 'El negocio acepta 99,9% en campaña, p95 bajo 1 s, estos RTO y RPO, y unos USD 175 al mes (300 con campaña).', valida: 'con el negocio; AWS Budgets avisa al 80%' },
]

// 5. Costo y evolución (USD al mes, us-east-1). Cada fila: [fijo, variable].

export interface FilaCosto {
  componente: string
  precio: string
  normal: [number, number]
  campana: [number, number]
}

export const COSTO_FILAS: FilaCosto[] = [
  { componente: 'RDS PostgreSQL Multi-AZ db.t4g.small, 20 GB', precio: '0,065/h; 0,23/GB-mes', normal: [52, 0], campana: [52, 4] },
  { componente: 'NAT Gateway', precio: '0,045/h; 0,045/GB', normal: [33, 2], campana: [33, 3] },
  { componente: 'EC2 t3.small, 8 GB gp3', precio: '0,0208/h; 0,08/GB-mes', normal: [32, 0], campana: [32, 10] },
  { componente: 'Créditos de CPU de t3 (unlimited)', precio: '0,05/vCPU-h sobre la línea base', normal: [0, 0], campana: [0, 22] },
  { componente: 'ALB', precio: '0,0225/h; 0,008/LCU-h', normal: [16, 6], campana: [16, 15] },
  { componente: 'CloudFront (Sudamérica) y S3', precio: '0,110/GB; 0,022 por 10.000 peticiones', normal: [0, 16], campana: [0, 88] },
  { componente: 'IPv4 públicas (2 del ALB, 1 del NAT)', precio: '0,005/h cada una', normal: [11, 0], campana: [11, 0] },
  { componente: 'Backups en us-east-2, CloudWatch, Lambda y Secrets Manager', precio: '0,095/GB-mes; 0,10 por alarma; 0,20 por millón', normal: [3, 2], campana: [3, 3] },
]

export const COSTO_FUENTE =
  'AWS Price List API en us-east-1, 21 y 23 de octubre de 2026: precios on-demand, CloudFront con tarifa de Sudamérica, 730 h al mes, sin capa gratuita.'

export const COSTO_CONSUMO = [
  'Normal: 2 EC2; 100 GB y 2 millones de peticiones en CloudFront; 30.000 pedidos.',
  'Campaña: 5 días con 6 EC2 al 50% de CPU; 600 GB y 9 millones de peticiones; 150.000 pedidos.',
]

export const COSTO_DRIVERS = [
  'El 85% del mes normal es fijo (RDS, NAT, horas del ALB, IPv4 y 2 EC2): el piso lo ponen la base y la red, no el cómputo.',
  'En campaña manda el tráfico: CloudFront pasa de 16 a 88 y los créditos de CPU suman 22; las 4 EC2 extra cuestan 10.',
]

export const COSTO_PALANCAS =
  'Palancas: la capa gratuita de CloudFront (1 TB y 10 millones de peticiones) deja USD 158 y 206; RDS reservado tras 3 meses de métricas estables; el ambiente de pruebas solo vive durante la prueba.'

export const EVOLUCION = [
  { cuando: 'Ahora', que: 'D1 a D5', senal: 'Es lo que la campaña necesita' },
  { cuando: 'Tras la campaña', que: 'Inventario con el patrón de D5', senal: 'Campaña cerrada y reportes estables' },
  { cuando: 'Siguiente', que: 'WAF y destino on-failure de la Lambda', senal: 'Bots en los logs; errores de la Lambda' },
  { cuando: 'Siguiente', que: 'ElastiCache o réplica de lectura', senal: 'CPU de RDS sobre 60% o p95 sobre 1 s' },
  { cuando: 'Después', que: 'ECS Fargate para la API', senal: 'Despliegues semanales y equipo en contenedores' },
  { cuando: 'Después', que: 'Warm standby en us-east-2', senal: 'RTO regional menor a 1 h y presupuesto para duplicar el fijo' },
]

export const NO_AHORA =
  'No hago ahora contenedores, serverless para el núcleo, NoSQL ni multirregión activa: resuelven problemas que el caso no tiene y exigen operación que el equipo no tiene.'

// Evidencia y validación (sitio y defensa)

export const EVIDENCIA = [
  { lab: 'Lab 01 · Red base', comprobe: 'VPC 10.20.0.0/16 con 10.20.1.0/24 en 1a y 10.20.2.0/24 en 1b. Dos AZ preparan la alta disponibilidad, pero no la dan sin cómputo repartido.', sustenta: 'Figura 1' },
  { lab: 'Lab 02 · Resiliencia', comprobe: 'El ALB repartió 10 y 10 peticiones entre dos AZ. Al terminar una instancia, el ALB la sacó en 35 s y el ASG la repuso en 2 min 40 s sin cortar el servicio.', sustenta: 'D1, D2' },
  { lab: 'Lab 03 · Almacenamiento', comprobe: 'S3 guardó versiones de un objeto y EFS dio el mismo archivo a dos instancias en AZ distintas. Versionar un objeto no respalda una base.', sustenta: 'D2' },
  { lab: 'Lab 04 · Networking', comprobe: 'Una subnet es pública solo por su route table. A → B:8080 pasó, dio timeout al quitar la regla que referencia otro SG y volvió al restaurarla.', sustenta: 'D3' },
  { lab: 'Lab 05 · Seguridad', comprobe: 'Mismo rol, misma red: GetObject permitido en allowed/*, AccessDenied en otro Resource y en PutObject. SSE-S3 y AttachRolePolicy en CloudTrail.', sustenta: 'D3' },
  { lab: 'Lab 06 · Operación', comprobe: 'CREATE_COMPLETE en 26 s; ALARM con la CPU en 75 y 100% en 2 de 2 periodos de 5 min; update sin reemplazo y delete sin residuos. La alarma no tenía acciones.', sustenta: 'D1, D4' },
  { lab: 'Lab 07 · Modernización', comprobe: 'incoming/order-001.json → ObjectCreated:Put → una invocación → log con el mismo key y requestId. .txt y archive/ no invocaron.', sustenta: 'D5' },
]

export const NO_CUBREN =
  'Los labs no cubren CloudFront, RDS Multi-AZ, el NAT ni la carga real. Para eso están estas pruebas.'

export const PRUEBAS = [
  { prueba: 'Prueba de carga hasta 10 veces la carga normal, en un ambiente temporal', esperado: 'El ASG no pasa de 6, el p95 queda bajo 1 s y CloudFront responde casi todo desde caché', valida: 'D1' },
  { prueba: 'Terminar una instancia y detener la app en otra', esperado: 'El ALB saca ambas y el ASG reemplaza las dos', valida: 'D2' },
  { prueba: 'Reboot con failover de RDS durante la carga', esperado: 'La app vuelve a escribir en 1 a 2 min y los pedidos confirmados coinciden antes y después', valida: 'D2' },
  { prueba: 'Llamar al ALB directo y a la base desde un SG ajeno', esperado: 'Timeout en ambos; por CloudFront responde 200', valida: 'D3' },
  { prueba: 'Con el rol de la app, borrar en reports/', esperado: 'AccessDenied, y CloudTrail muestra quién cambió cada permiso', valida: 'D3' },
  { prueba: 'Quitar la ruta al NAT en una subnet de app', esperado: 'La venta sigue; solo fallan los parches', valida: 'D3' },
  { prueba: 'Cambiar a mano un SG del stack y disparar una alarma de prueba', esperado: 'La detección de drift lo marca y el aviso llega por SNS al responsable', valida: 'D4' },
  { prueba: 'Subir dos veces el mismo pedido a incoming/, y un .txt', esperado: 'Dos invocaciones y un solo objeto en reports/; el .txt no invoca', valida: 'D5' },
  { prueba: 'Restaurar la base a un punto en el tiempo y el stack completo en us-east-2', esperado: 'RTO medido contra 1 h y 4 h', valida: 'D2, D4' },
]

// Escenas del panel: un paso por clic. scenes.ts anima los mismos pasos, en el mismo orden.

export interface Paso {
  link?: Link
  texto: string
  log: string
}

export interface Escena {
  id: string
  tecla: string
  titulo: string
  decision?: string
  pasos: Paso[]
}

export const ESCENAS: Escena[] = [
  {
    id: 'problema',
    tecla: '1',
    titulo: 'El problema',
    pasos: [
      { texto: 'Digital Café Luna prepara una campaña nacional de pocos días con demanda incierta, y hoy compra capacidad antes de conocer la demanda.', log: 'CASO  campaña nacional · demanda incierta' },
      { link: 'restriccion', texto: 'R1 · Datos de clientes y pedidos: ningún pedido confirmado se pierde, y los datos son privados, cifrados y auditables.', log: 'R1  datos → D2, D3' },
      { link: 'restriccion', texto: 'R2 · Demanda irregular: la capacidad debe seguir a la demanda, con un techo de costo.', log: 'R2  demanda → D1, D5' },
      { link: 'restriccion', texto: 'R3 · Resiliencia: seguir vendiendo si cae una instancia o una zona de disponibilidad.', log: 'R3  resiliencia → D2' },
      { link: 'restriccion', texto: 'R4 · Equipo pequeño y R5 · costo controlado: pocas piezas que operar, todo como código, y un costo fijo que se pueda justificar.', log: 'R4 → D2, D4, D5 · R5 → D1, D3' },
      { link: 'restriccion', texto: 'R6 · Evolución sin rehacer. Cuando chocan, manda R1, luego R2, R3 y R5; lo que el equipo no pueda operar, no entra.', log: 'PRIORIDAD  R1 > R2 > R3 > R5' },
    ],
  },
  {
    id: 'compra',
    tecla: '2',
    titulo: 'Una compra',
    pasos: [
      { texto: 'Un cliente abre la campaña: CloudFront la responde desde su caché en el borde, sin tocar las EC2.', log: 'CloudFront  HIT  GET /campana  200' },
      { texto: 'Al comprar, la llamada a /api pasa de CloudFront al ALB, que solo acepta tráfico de CloudFront.', log: 'ALB  POST /api/pedidos  origen CloudFront' },
      { texto: 'El ALB la entrega a una EC2 sana, y la app guarda el pedido en RDS, que copia la escritura al standby de la otra AZ antes de confirmar.', log: 'RDS  COMMIT pedido 1042 · copia en 1b' },
      { texto: 'La pasarela confirma el pago con un webhook firmado (supuesto S3), y la app deja incoming/1042.json en S3 por el gateway endpoint.', log: 'S3  PUT incoming/1042.json · endpoint' },
      { texto: 'S3 emite ObjectCreated: la Lambda escribe el reporte y una línea de log con el mismo id.', log: 'Lambda  reports/2026-11-04/1042.json' },
    ],
  },
  {
    id: 'campana',
    tecla: '3',
    titulo: 'Llega la campaña',
    decision: 'D1',
    pasos: [
      { link: 'restriccion', texto: 'La campaña multiplica las visitas por 10 durante unos días, casi todas a contenido estático (supuesto S1), y el presupuesto no paga capacidad ociosa.', log: 'TRÁFICO  ×10 durante 3 a 5 días · sup. S1' },
      { link: 'decision', texto: 'No compro capacidad para el pico: lo absorbo en el borde y con una API elástica que tiene techo.', log: 'D1  capacidad que sigue a la demanda' },
      { link: 'mecanismo', texto: 'La víspera, una acción programada sube el mínimo del ASG de 2 a 4: una instancia nueva tarda minutos en atender, y la fecha se conoce.', log: 'ASG  acción programada · mínimo 2 → 4' },
      { link: 'mecanismo', texto: 'En el pico, CloudFront responde 9 de cada 10 peticiones desde caché (supuesto S1) y solo /api llega a las EC2. Con la CPU promedio sobre 50%, target tracking agrega instancias hasta 6.', log: 'ASG  CPU 68% > 50% · deseadas 4 → 6 · sup. S1' },
      { link: 'consecuencia', texto: 'La capacidad siguió a la demanda: 6 EC2 en el pico y otra vez 2 al cerrar la campaña. El mes pasa de USD 173 a 292 y vuelve al piso.', log: 'ASG  deseadas 6 → 2 · USD 292 → 173 · sup. S1' },
      { link: 'tradeoff', texto: 'Ahorro capacidad ociosa (6 EC2 fijas costarían USD 61 más al mes), pero vigilo el escalamiento: si con 6 instancias el p95 pasa de 1 s (supuesto S5), la alarma avisa al responsable.', log: 'ALARMA  p95 > 1 s con ASG en 6 → SNS · sup. S5' },
    ],
  },
  {
    id: 'falla-az',
    tecla: '4',
    titulo: 'Cae una zona',
    decision: 'D2',
    pasos: [
      { link: 'restriccion', texto: 'Un pedido confirmado no se puede perder, y la venta debe seguir si cae una zona de disponibilidad.', log: 'R1 · R3  no perder pedidos' },
      { link: 'decision', texto: 'Todo va en dos AZ, y el estado vive fuera de las instancias, en RDS PostgreSQL Multi-AZ.', log: 'D2  dos AZ · estado en RDS' },
      { link: 'mecanismo', texto: 'Falla us-east-1a. El ALB deja de enviar a las instancias que no pasan el health check, y todo el tráfico va a us-east-1b.', log: 'ALB  targets de 1a sin salud → 1b' },
      { link: 'mecanismo', texto: 'RDS promueve el standby y mueve el endpoint: la app sigue escribiendo en la misma dirección. El ASG repone la capacidad en la AZ sana.', log: 'RDS  failover 1a → 1b · ASG lanza en 1b' },
      { link: 'consecuencia', texto: 'La venta siguió en 1 a 2 minutos y ningún pedido confirmado se perdió: RPO 0, dentro del objetivo (supuesto S5).', log: 'RTO 1-2 min · RPO 0 · sup. S5' },
      { link: 'tradeoff', texto: 'Pago USD 26 más al mes por el standby. El NAT estaba en 1a: la otra AZ queda sin parches ni Session Manager, pero vender no depende del NAT (supuesto S3).', log: 'NAT 1a caído · la venta sigue · sup. S3' },
    ],
  },
  {
    id: 'intruso',
    tecla: '5',
    titulo: 'Una sola puerta',
    decision: 'D3',
    pasos: [
      { link: 'restriccion', texto: 'Hay datos de clientes y pedidos, y cada componente expuesto a Internet es superficie de ataque.', log: 'R1  datos de clientes' },
      { link: 'decision', texto: 'CloudFront es la única entrada pública; la app y la base viven en subnets privadas.', log: 'D3  una sola puerta' },
      { link: 'mecanismo', texto: 'Alguien llama al ALB saltándose CloudFront. El SG del ALB solo acepta la prefix list de CloudFront: la conexión expira.', log: 'ALB  443 desde 203.0.113.7 · timeout' },
      { link: 'mecanismo', texto: 'Intenta llegar a la base: no tiene IP pública ni ruta desde Internet, y su SG solo acepta 5432 desde la app.', log: 'RDS  sin ruta desde Internet' },
      { link: 'consecuencia', texto: 'Un error en la app intenta borrar un reporte: llega a S3 por el endpoint, pero su rol no tiene esa Action. Llegar no es estar autorizado.', log: 'S3  DeleteObject reports/ · AccessDenied' },
      { link: 'tradeoff', texto: 'El costo es mantener reglas en cada capa: una policy mal escrita también bloquea a la app. CloudTrail dice quién cambió qué permiso.', log: 'CloudTrail  PutRolePolicy · quién y cuándo' },
    ],
  },
  {
    id: 'operacion',
    tecla: '6',
    titulo: 'Todo como código',
    decision: 'D4',
    pasos: [
      { link: 'restriccion', texto: 'El equipo es pequeño: un cambio manual no se repite igual, y una alarma que nadie mira no protege nada.', log: 'R4  equipo pequeño' },
      { link: 'decision', texto: 'Toda la infraestructura va en CloudFormation, y cada alarma tiene una acción o un responsable.', log: 'D4  todo como código' },
      { link: 'mecanismo', texto: 'Tres templates (red, datos y app) crean el panel completo; un change set muestra qué se reemplaza antes de aplicar, y el mismo template levanta y borra el ambiente de la prueba de carga.', log: 'CFN  change set app-v2 · reemplazos 0' },
      { link: 'mecanismo', texto: 'El ASG escala solo. Lo que pide criterio (5XX, instancias sanas, RDS, errores de la Lambda, presupuesto) llega por SNS al responsable de turno, con un runbook de una página.', log: 'ALARMA  5XX del ALB > 1% → SNS' },
      { link: 'consecuencia', texto: 'Cada cambio es repetible y auditable, y cada señal termina en una acción.', log: 'CFN  UPDATE_COMPLETE · auditado' },
      { link: 'tradeoff', texto: 'Cedo portabilidad frente a Terraform, y un cambio hecho a mano en la consola aparece como drift.', log: 'CFN  drift detectado en sg-app' },
    ],
  },
  {
    id: 'evento',
    tecla: '7',
    titulo: 'Reporte por evento',
    decision: 'D5',
    pasos: [
      { link: 'restriccion', texto: 'Los reportes son intermitentes y de bajo riesgo: no deben competir con la API en el pico ni justificar otro servidor.', log: 'R2 · R4  trabajo intermitente' },
      { link: 'decision', texto: 'Reportes por evento, S3 ObjectCreated → Lambda; la API sigue en EC2, porque es continua.', log: 'D5  solo lo intermitente' },
      { link: 'mecanismo', texto: 'Con el pedido confirmado, la app escribe incoming/1042.json, y S3 emite ObjectCreated:Put e invoca la Lambda de forma asíncrona.', log: 'S3 → Lambda  ObjectCreated:Put' },
      { link: 'consecuencia', texto: 'La Lambda escribe reports/2026-11-04/1042.json y una línea en CloudWatch Logs con el mismo id: ninguna EC2 del pico trabaja en esto.', log: 'Logs  incoming/1042.json · requestId' },
      { link: 'tradeoff', texto: 'El evento llega al menos una vez. Si se repite, la Lambda sobrescribe el mismo archivo: queda un reporte, no dos.', log: 'S3 → Lambda  repetido · mismo reporte' },
      { link: 'tradeoff', texto: 'Un .txt o un archivo en archive/ no cumple el filtro y no invoca nada, como en el Lab 07.', log: 'incoming/1042.txt · sin invocación' },
    ],
  },
]

// Modo adaptación: piezas de la tabla de evolución que se pueden agregar al panel durante la defensa.

export const PIEZAS = [
  { id: 'waf', nombre: 'WAF', corto: 'WAF', detalle: 'en CloudFront' },
  { id: 'cache', nombre: 'ElastiCache', corto: 'ElastiCache', detalle: 'catálogo' },
  { id: 'replica', nombre: 'Réplica de lectura', corto: 'Réplica', detalle: 'RDS' },
  { id: 'nat2', nombre: 'NAT en 1b', corto: 'NAT', detalle: 'salida redundante' },
  { id: 'fargate', nombre: 'ECS Fargate', corto: 'ECS Fargate', detalle: 'la API en contenedor' },
  { id: 'standby', nombre: 'Warm standby', corto: 'Standby', detalle: 'us-east-2' },
] as const

export const ALARMAS = [
  { id: 'cpu', texto: 'CPU > 50%', accion: 'ASG escala' },
  { id: 'p95', texto: 'p95 > 1 s', accion: 'SNS · turno' },
  { id: 'targets', texto: 'Sanas < 2', accion: 'SNS · turno' },
  { id: 'failover', texto: 'Failover RDS', accion: 'evento RDS' },
  { id: 'errores', texto: 'Errores', accion: 'SNS · turno' },
  { id: 'drift', texto: 'Drift', accion: 'CFN' },
] as const

export type AlarmaId = (typeof ALARMAS)[number]['id']
export type PiezaId = (typeof PIEZAS)[number]['id']
