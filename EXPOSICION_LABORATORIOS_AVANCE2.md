# Avance 2 de Al Toque: explicación de los 13 puntos para exposición y PPT

> Este análisis y sus referencias de línea corresponden al avance 2 anterior a la autenticación real. La ampliación posterior cambia el login, la recuperación y el almacenamiento del PIN/preferencias; consultar [AUTENTICACION_FIREBASE.md](AUTENTICACION_FIREBASE.md).

## Qué debes aclarar al comenzar

La lista que indica que no existen FlatList, axios o AsyncStorage describe carencias anteriores. En el código actual del avance 2 ya se incorporaron esas herramientas. Sin embargo, la paginación no está implementada y algunos requisitos están cubiertos parcialmente.

Esta revisión se basa en el código del proyecto; no constituye una prueba de ejecución ni una medición de rendimiento. Las referencias de línea corresponden al código revisado y pueden cambiar con futuras ediciones.

| Punto | Estado actual | Dónde se demuestra |
| --- | --- | --- |
| 1. FlatList | Implementado en movimientos y FAQs. | Inicio y Centro de ayuda. |
| 2. axios | Declarado como dependencia y utilizado. | Servicio de tipos de cambio. |
| 3. API REST real | Implementada. | Tarjetas de USD, EUR y BRL en Inicio. |
| 4. Loading, error, vacío y reintento | Parcial: carga/error/reintento para API; vacío para listas locales. | Tipo de cambio, movimientos y FAQs. |
| 5. Pull-to-refresh | Implementado para volver a consultar tipos de cambio. | Deslizar hacia abajo en Inicio. |
| 6. Paginación o carga incremental | No implementado para obtener datos por páginas. | No hay page, cursor ni onEndReached para solicitar más datos. |
| 7. AsyncStorage | Declarado como dependencia y utilizado. | Servicio de almacenamiento y contexto. |
| 8. JSON.stringify / JSON.parse | Implementado. | Funciones de escritura y lectura local. |
| 9. Persistencia | Parcial: PIN, saldo visible, movimientos y caché; filtros sin persistencia. | Contexto y Home. |
| 10. useMemo | Implementado. | Home, Soporte, Login y contexto. |
| 11. useCallback | Implementado. | Funciones de carga, eventos y renderItem. |
| 12. React.memo | Implementado en dos componentes. | TransactionRow y FaqItem. |
| 13. Optimización de listas | Configurada; getItemLayout necesita revisar su cálculo. | FlatList de Home y Soporte. |

## 1. FlatList: movimientos y preguntas frecuentes

**Dónde está:**
- src/screens/HomeScreen.js:456: FlatList de movimientos.
- src/screens/HomeScreen.js:134: renderTransaction.
- src/screens/SupportScreen.js:227: FlatList de preguntas frecuentes.
- src/screens/SupportScreen.js:88: renderFaq.

**Cómo se aplica:** Home entrega filteredTransactions mediante data y usa renderTransaction para representar cada movimiento con TransactionRow. Soporte entrega filteredFaqs y usa renderFaq para representar cada pregunta con FaqItem. Los encabezados de cada pantalla se integran mediante ListHeaderComponent.

```jsx
// HomeScreen.js
<FlatList
  data={filteredTransactions}
  keyExtractor={keyExtractor}
  renderItem={renderTransaction}
  ListHeaderComponent={ListHeader}
  // Otras propiedades en el archivo original.
/>
```

**Para tu PPT:** «Se reemplazó el listado de movimientos y FAQs por FlatList, que organiza el renderizado mediante una ventana de elementos».

**Para explicarlo:** «En Inicio, cada movimiento es una fila de TransactionRow. En Ayuda, cada pregunta es un FaqItem. FlatList recibe los datos y una función que indica cómo dibujar cada elemento, en lugar de construir toda la lista con ScrollView y map».

**Qué mostrar:** Home con sus movimientos y Centro de ayuda con sus preguntas. El uso de FlatList se demuestra con código, porque la apariencia por sí sola no identifica qué componente se utilizó.

**Precisión:** Se mantiene .map() para conjuntos pequeños: tres tipos de cambio, tres filtros, puntos del PIN y teclado. Eso no contradice la sustitución de las listas principales.

## 2. axios: cliente HTTP del tipo de cambio

**Dónde está:** package.json, dependencia axios ^1.20.0; src/services/api.js:1, :3 y :31.

```js
import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://open.er-api.com/v6",
  timeout: 8000,
});

// Dentro de fetchExchangeRates:
const response = await apiClient.get("/latest/PEN");
```

**Cómo se aplica:** Se centralizan la dirección base y el tiempo máximo de espera en un cliente. Home utiliza fetchExchangeRates, sin repetir la configuración HTTP en la pantalla.

**Para tu PPT:** «axios permite realizar la petición GET del tipo de cambio desde un servicio separado de la interfaz».

**Para explicarlo:** «La pantalla solicita los datos al servicio api.js. Ese servicio usa axios para consultar una dirección externa y devuelve información preparada para las tarjetas».

**Precisión:** La dependencia está declarada y el import existe. Esta revisión no comprueba una instalación nueva ni ejecuta la petición.

## 3. Consumo de una API REST real

**Dónde está:** src/services/api.js:8, :14 y :30; src/screens/HomeScreen.js:103 y :125.

**Servicio configurado:** GET https://open.er-api.com/v6/latest/PEN.

**Cómo se aplica:**
1. Al montar Home, un useEffect llama a loadRates.
2. loadRates ejecuta fetchExchangeRates.
3. El servicio comprueba que response.data.result sea success.
4. Toma las cotizaciones de USD, EUR y BRL.
5. normalizeRate calcula el inverso de cada cotización para expresarla en soles por unidad de moneda extranjera.
6. Home recibe las tarjetas normalizadas y las muestra en «Tipo de cambio».

**Ejemplo didáctico:** Si la respuesta indicara 0.25 USD por 1 PEN, la operación 1 / 0.25 produciría S/ 4.00 por USD. Es un ejemplo matemático, no una cotización vigente.

**Para tu PPT:** «Se consume una API REST externa y se transforma su respuesta en tres tarjetas de tipo de cambio referencial».

**Para explicarlo:** «Los importes de esas tarjetas provienen de una consulta externa. El servicio transforma la respuesta para mostrar cuánto equivale un dólar, un euro o un real en soles».

**Qué mostrar:** Las tres tarjetas debajo de cashback. No atribuir a esta API los movimientos: esos datos son ejemplos locales definidos en AuthContext.js.

## 4. Loading, error, estado vacío y botón reintentar

**Dónde está:**
- HomeScreen.js:52: ratesLoading; :53: ratesError.
- HomeScreen.js:103: loadRates administra carga, resultado, error y finally.
- HomeScreen.js:342: ActivityIndicator.
- HomeScreen.js:347: RetryState cuando hay error y no hay tarjetas.
- HomeScreen.js:357: advertencia cuando se conserva información guardada.
- HomeScreen.js:421: EmptyState para movimientos sin coincidencias.
- SupportScreen.js:168 y :232: estado sin resultados de FAQs.
- src/components/RetryState.js y EmptyState.js: componentes visuales reutilizables.

**Cómo se aplica a la API:**
- Antes de consultar: activa la carga y limpia el error anterior.
- Al obtener datos: actualiza rates y guarda una copia local.
- Al fallar: busca datos en caché y establece «No pudimos actualizar el tipo de cambio.».
- Si no hay tarjetas: muestra el mensaje y «Reintentar».
- Si hay datos guardados: muestra las tarjetas y «Mostrando ultimo dato guardado. Desliza para reintentar.».
- En finally: desactiva el indicador de carga.

**Para tu PPT:** «El tipo de cambio tiene carga, manejo de error y reintento; las búsquedas de movimientos y FAQs tienen estados vacíos».

**Para explicarlo:** «El usuario recibe una señal mientras esperamos la API. Si la consulta falla, puede reintentar o ver la última información guardada. Si una búsqueda local no encuentra coincidencias, mostramos un mensaje en lugar de una lista en blanco».

**Límite del requisito:** No hay un estado vacío específico para una respuesta exitosa de la API sin cotizaciones válidas. El servicio genera tres tarjetas y utiliza 0 cuando falta una tasa. Por eso no debes afirmar que el estado vacío de datos externos está completamente resuelto: EmptyState se aplica a movimientos y FAQs locales.

## 5. Pull-to-refresh

**Dónde está:** src/screens/HomeScreen.js:128 y :472.

```js
const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  await loadRates({ silent: true });
  setRefreshing(false);
}, [loadRates]);
```

**Cómo se aplica:** Un RefreshControl conectado a FlatList ejecuta handleRefresh cuando se desliza hacia abajo. refreshing controla el indicador del gesto. silent evita activar el indicador adicional de ratesLoading en esa consulta.

**Para tu PPT:** «Al deslizar hacia abajo en Inicio se vuelve a consultar el tipo de cambio».

**Para explicarlo:** «El gesto inicia una nueva consulta y mantiene un indicador hasta que termina. No descarga movimientos nuevos: actualiza las cotizaciones».

**Qué mostrar:** Arrastrar hacia abajo desde el inicio de la lista y señalar el indicador.

## 6. Paginación o carga incremental

**Estado: pendiente.**

**Evidencia:** Home entrega a FlatList todo filteredTransactions, derivado del arreglo completo de movimientos del contexto. No existe una petición con número de página, límite o cursor, ni un onEndReached que solicite más registros. Las FAQs también están definidas localmente.

**Lo que sí existe:** initialNumToRender y maxToRenderPerBatch administran cuántos elementos se renderizan al inicio y por lote. No descargan nuevas páginas ni amplían los datos del arreglo.

**Para tu PPT:** «Se configuró el renderizado por lotes de la lista; la paginación de datos queda pendiente».

**Para explicarlo:** «Hay una diferencia entre dibujar elementos por lotes y obtener más registros. FlatList administra la representación de los datos que ya tenemos, pero todavía no pedimos una segunda página a un servidor».

## 7. AsyncStorage

**Dónde está:** package.json, dependencia @react-native-async-storage/async-storage 2.2.0; src/services/storage.js:1, :12, :22 y :32.

**Cómo se aplica:** El servicio ofrece getStoredJson para leer, setStoredJson para guardar y removeStoredValue para eliminar. El contexto y Home utilizan lectura y escritura con manejo de errores.

**Para tu PPT:** «AsyncStorage conserva localmente el PIN de la app, la visibilidad del saldo, los movimientos y la caché del tipo de cambio».

**Para explicarlo:** «Antes, esos valores dependían solo de la memoria de la aplicación. Ahora se pueden recuperar desde el almacenamiento del dispositivo al iniciar o al necesitar una copia guardada».

**Precisión:** removeStoredValue está definida, pero no se utiliza en un flujo actual. Guardar el PIN con AsyncStorage no demuestra almacenamiento cifrado ni persistencia de una sesión de Firebase.

## 8. JSON.stringify y JSON.parse

**Dónde está:** src/services/storage.js:15 y :24.

```js
// Lectura:
const rawValue = await AsyncStorage.getItem(key);
return rawValue ? JSON.parse(rawValue) : fallbackValue;

// Escritura:
await AsyncStorage.setItem(key, JSON.stringify(value));
```

**Cómo se aplica:** AsyncStorage recibe valores de texto. JSON.stringify convierte booleanos, arreglos y otros valores a texto JSON. JSON.parse reconstruye el valor al leerlo.

**Ejemplo:** La preferencia booleana false se escribe como el texto JSON false y se recupera como booleano. Los movimientos se escriben como un arreglo serializado y se recuperan como un arreglo de objetos.

**Para tu PPT:** «Se serializan los datos con JSON.stringify al guardar y se reconstruyen con JSON.parse al leer».

**Para explicarlo:** «No guardamos directamente la lista como una variable de React. La convertimos a texto para almacenarla y la reconstruimos para volver a usarla».

## 9. Persistencia local: qué se guarda y qué no

**Dónde está:** src/context/AuthContext.js:66 para lectura inicial y :93, :99 y :105 para escritura; src/screens/HomeScreen.js:103 para la caché; src/services/storage.js:3 para las claves.

| Dato | Clave | Escritura y recuperación | Estado |
| --- | --- | --- | --- |
| PIN actualizado | @altoque/user-pin | updatePin cambia userPin; un useEffect lo guarda; hydrateStoredSession lo recupera. | Persistido. |
| Preferencia de mostrar saldo | @altoque/show-balance | toggleBalanceVisibility cambia el booleano; se guarda y recupera mediante el contexto. | Persistida. |
| Movimientos | @altoque/transactions | Se guarda el arreglo del contexto y se recupera al iniciar. | Persistidos; son datos de ejemplo locales. |
| Tipos de cambio | @altoque/offers | Home guarda una respuesta exitosa y lee la copia si falla una consulta. | Caché implementada. |
| Filtro Todos/Ingresos/Gastos | Sin clave | selectedFilter es estado local de Home. | No persistido. |
| Texto de búsqueda | Sin clave | searchQuery es estado local de cada pantalla. | No persistido. |
| Monto del saldo | Sin clave | balance se inicializa en el contexto con 1840.5. | No persistido como dato independiente. |
| Intentos fallidos y bloqueo | Sin clave | Estado local de Login. | No persistidos. |

**Cómo se aplica:** isStorageReady evita guardar los valores iniciales mientras todavía se están leyendo los datos previos. La caché de cotizaciones se usa como alternativa ante un error; no se muestra automáticamente antes de consultar la API.

**Para tu PPT:** «Se persisten PIN, visibilidad del saldo, movimientos y cotizaciones; filtros y búsquedas permanecen temporales».

**Para explicarlo:** «Al volver a abrir la app podemos recuperar la preferencia de ocultar el saldo y el PIN actualizado. El filtro de movimientos vuelve a su estado inicial porque todavía no lo guardamos».

**Qué mostrar:** Ocultar el saldo, cerrar y abrir la app, y comprobar que sigue oculto. Presentarlo como demostración a realizar; esta revisión documental no ejecutó ese recorrido.

**Límites adicionales:** La lectura de movimientos exige un arreglo con elementos; un arreglo vacío almacenado no reemplaza los movimientos iniciales. La caché no tiene un vencimiento programado.

## 10. useMemo: valores y listas derivadas

**Dónde está y qué memoriza:**

| Archivo y línea | Valor | Dependencias o propósito |
| --- | --- | --- |
| HomeScreen.js:61 | formattedBalance | Cambia con balance o showBalance; formatea soles o devuelve S/ ******. |
| HomeScreen.js:71 | filteredTransactions | Cambia con búsqueda, filtro o movimientos. |
| HomeScreen.js:87 | totals | Cuenta ingresos y gastos cuando cambia transactions. |
| HomeScreen.js:164 | ListHeader | Conserva el elemento del encabezado mientras sus dependencias no cambian. |
| SupportScreen.js:53 | filteredFaqs | Filtra preguntas y respuestas según searchQuery. |
| SupportScreen.js:101, :168 y :179 | Encabezado, vacío y pie | Conserva las referencias de esos elementos según sus dependencias. |
| LoginScreen.js:117 | rows | Construye las filas cuando cambia keypadNumbers. |
| AuthContext.js:137 | contextValue | Conserva la referencia del objeto compartido mientras sus dependencias no cambian. |

**Para tu PPT:** «useMemo conserva cálculos derivados como saldo formateado, movimientos filtrados y contadores mientras sus entradas no cambian».

**Para explicarlo:** «Si se abre un modal sin modificar movimientos, búsqueda o filtro, no necesitamos recalcular la lista filtrada por ese motivo. useMemo permite reutilizar ese resultado».

**Precisión:** No guarda datos al cerrar la aplicación ni evita todo renderizado. Tampoco debe presentarse como una mejora de velocidad medida: no hay un perfil de rendimiento en esta revisión.

## 11. useCallback: handlers y renderItem

**Dónde está:**
- HomeScreen.js:103: loadRates.
- HomeScreen.js:128: handleRefresh.
- HomeScreen.js:134: renderTransaction, usado como renderItem.
- HomeScreen.js:146: keyExtractor.
- HomeScreen.js:148: renderRateCard.
- SupportScreen.js:67: toggleAccordion; :83: clearSearch; :88: renderFaq; :99: keyExtractor.
- LoginScreen.js:32, :54, :89 y :95: reorganización del teclado, ingreso, borrado y Face ID.
- AuthContext.js:111, :126, :128 y :133: funciones compartidas de recuperación, validación, actualización de PIN y visibilidad del saldo.

**Cómo se aplica:** Conserva la referencia de una función mientras sus dependencias no cambian. Ayuda a entregar funciones estables a listas y componentes memoizados.

**Para tu PPT:** «useCallback mantiene estables funciones de eventos, carga y renderItem según sus dependencias».

**Para explicarlo:** «No memoriza lo que devuelve la función; conserva la función. Por ejemplo, las preguntas reciben la misma referencia de toggleAccordion mientras no sea necesario cambiarla».

**Precisión:** Algunas funciones cambian cuando cambian sus dependencias. renderTransaction depende de la cantidad filtrada y handleKeyPress depende, entre otros valores, del PIN ingresado. No son referencias invariables durante toda la ejecución.

## 12. React.memo: filas de movimientos y FAQs

**Dónde está:** src/components/TransactionRow.js:50 y src/components/FaqItem.js:30.

```js
export default React.memo(TransactionRow);
export default React.memo(FaqItem);
```

**Cómo se aplica:** React puede omitir el render de estos componentes cuando sus props no cambian según la comparación superficial predeterminada.

- TransactionRow recibe item e isLast.
- FaqItem recibe item, isExpanded y onToggle.
- En Soporte, toggleAccordion está envuelta en useCallback, lo que ayuda a conservar la referencia de onToggle.

**Para tu PPT:** «React.memo se aplica a TransactionRow y FaqItem para evitar renders innecesarios cuando sus propiedades permanecen iguales».

**Para explicarlo:** «Al expandir una pregunta, cambian las propiedades de las filas afectadas. Las demás pueden reutilizar su representación si reciben las mismas propiedades».

**Precisión:** No se aplica React.memo a promociones o tarjetas de tipo de cambio. renderRateCard usa useCallback, que es una técnica diferente. React.memo tampoco garantiza que un componente nunca vuelva a renderizarse.

## 13. Optimización de listas

**Dónde está:** src/screens/HomeScreen.js:456 y src/screens/SupportScreen.js:227.

| Propiedad | Home | Soporte | Para qué se utiliza |
| --- | --- | --- | --- |
| data | filteredTransactions | filteredFaqs | Datos que recibe cada lista. |
| renderItem | renderTransaction | renderFaq | Función de representación de cada fila, con useCallback. |
| keyExtractor | item.id | item.id | Proporciona una identidad estable a cada elemento. |
| initialNumToRender | 6 | 6 | Cantidad solicitada para el render inicial; las listas actuales tienen cuatro elementos base. |
| maxToRenderPerBatch | 8 | Sin configuración explícita | Tamaño máximo de lote de renderizado configurado en Home. |
| windowSize | 7 | Sin configuración explícita | Tamaño de la ventana de renderizado de Home, expresado en unidades de viewport, no en siete filas. |
| getItemLayout | length: 69; offset: 69 * index | No configurado | Estimación de medidas y posiciones de filas en Home. |
| ListHeaderComponent | Encabezado completo de Home | Encabezado de Ayuda | Integra contenido anterior a las filas dentro de la lista. |
| ListEmptyComponent | No se usa; EmptyState se inserta condicionalmente en el encabezado | ListEmpty | Representa el caso sin FAQs coincidentes. |
| ListFooterComponent | Espaciador y cierre visual | Pie de Ayuda | Contenido después de los elementos. |

**Para tu PPT:** «Las listas tienen claves estables, renderItem con useCallback y filas memoizadas. Home añade parámetros de renderizado y Soporte utiliza ListEmptyComponent».

**Para explicarlo:** «Cada movimiento o pregunta conserva su ID como clave. Además, configuramos cómo se dibuja cada fila y cuántas se solicitan inicialmente. Esto organiza el trabajo de renderizado, pero no implementa paginación».

**Limitación que debes conocer:** El getItemLayout de Home asume filas de 69 unidades y calcula offset sin incluir la altura del encabezado, aunque existe un ListHeaderComponent extenso. Esa altura fija tampoco está validada frente a textos variables o escalado de fuente. La propiedad está incorporada, pero su cálculo requiere revisión antes de presentarla como una optimización verificada.

## Orden sugerido del PPT

1. **Objetivo del avance 2:** aplicar conceptos de laboratorio en la billetera existente.
2. **Listas:** puntos 1 y 13. Capturas de movimientos y FAQs más fragmento de FlatList.
3. **Conexión externa:** puntos 2 y 3. Fragmento de axios y captura de las tres cotizaciones.
4. **Respuesta de la interfaz:** puntos 4 y 5. Carga, error, reintento y actualización por gesto.
5. **Almacenamiento:** puntos 7, 8 y 9. Diagrama «estado → JSON.stringify → AsyncStorage → JSON.parse → estado» y tabla de lo que se conserva.
6. **Optimización con hooks:** puntos 10, 11 y 12. Un ejemplo de useMemo, useCallback y React.memo.
7. **Alcance y pendientes:** punto 6, vacío de API, filtros sin persistencia y revisión de getItemLayout.

## Guion de cierre para decirlo en la exposición

«En el avance 2 aplicamos los laboratorios a funciones concretas de Al Toque. FlatList organiza movimientos y preguntas frecuentes; axios consulta tipos de cambio de una API externa; y la interfaz muestra carga, error y reintento. También agregamos actualización al deslizar, almacenamiento local con AsyncStorage y serialización JSON. useMemo, useCallback y React.memo se usan para conservar cálculos y referencias cuando corresponde. Todavía no implementamos paginación de datos, persistencia de filtros ni un estado vacío específico de la respuesta externa; además, debemos ajustar el cálculo de posiciones de la lista de Home».
