# Documentacion del Avance 2: Integracion de Hooks, API REST y Persistencia Local

## 1. Resumen

En este avance se mantuvo la aplicacion existente de billetera digital "Al Toque" y se integraron los conceptos trabajados en los laboratorios de Desarrollo de Aplicaciones Moviles sin crear otro proyecto, sin reemplazar Firebase y sin eliminar funcionalidades previas.

La mejora se concentro en tres frentes:

- Optimizacion de renderizado con hooks y componentes memoizados.
- Consumo de una API REST real con axios.
- Persistencia local con AsyncStorage usando JSON.stringify y JSON.parse.
- Mejora de experiencia de usuario con modales personalizados, teclado seguro dinamico y bloqueo por intentos fallidos.

## 2. Dependencias agregadas

Se agregaron las dependencias necesarias para los laboratorios:

```json
"@react-native-async-storage/async-storage": "2.2.0",
"axios": "^1.20.0"
```

AsyncStorage se instalo con la version recomendada para Expo SDK 57.

## 3. Archivos nuevos

### `src/services/storage.js`

Centraliza la persistencia local con AsyncStorage.

Conceptos aplicados:

- AsyncStorage.
- getItem, setItem y removeItem.
- JSON.stringify.
- JSON.parse.
- Manejo defensivo de errores de lectura/escritura.

Claves usadas:

- `@altoque/user-pin`
- `@altoque/show-balance`
- `@altoque/transactions`
- `@altoque/offers`

### `src/services/api.js`

Centraliza el consumo REST con axios.

Se consume la API publica `https://open.er-api.com/v6/latest/PEN` para obtener tipos de cambio referenciales desde PEN hacia monedas relevantes para una billetera digital.

Conceptos aplicados:

- axios.create.
- Consumo REST.
- Normalizacion de respuesta externa.
- Manejo de errores con throw.

### `src/components/TransactionRow.js`

Fila reutilizable para movimientos.

Conceptos aplicados:

- React.memo.
- Separacion de componentes.
- Renderizado optimizado de items de FlatList.

### `src/components/FaqItem.js`

Fila reutilizable para preguntas frecuentes.

Conceptos aplicados:

- React.memo.
- Acordeon controlado desde el componente padre.
- Props estables con useCallback.

### `src/components/EmptyState.js`

Componente reutilizable para estados vacios.

Se usa cuando una busqueda o filtro no devuelve resultados.

### `src/components/RetryState.js`

Componente reutilizable para error con boton de reintento.

Se usa cuando falla la carga de datos externos y no existe cache local disponible.

### `src/components/AppModal.js`

Componente reutilizable para reemplazar los `Alert.alert` nativos de React Native por un modal visual propio de la aplicacion.

Conceptos aplicados:

- Modal transparente con fondo oscurecido.
- Iconografia con Feather.
- Boton primario y boton secundario opcional.
- Reutilizacion visual en Login, Home y flujo de recuperacion.
- Mejora de consistencia visual frente a alertas nativas del sistema.

## 4. Archivos modificados

### `src/context/AuthContext.js`

Se agrego persistencia local sin reemplazar Firebase.

Conceptos aplicados:

- useEffect para rehidratar datos al iniciar.
- useEffect para guardar cambios en AsyncStorage.
- useCallback para funciones globales.
- useMemo para estabilizar el value del provider.
- Persistencia de PIN.
- Persistencia de preferencia de mostrar/ocultar saldo.
- Persistencia de movimientos.

Firebase Auth se mantiene para el flujo de recuperacion de clave.

### `src/screens/HomeScreen.js`

Se mejoro el dashboard principal manteniendo el diseno general.

Conceptos aplicados:

- FlatList para movimientos.
- keyExtractor.
- initialNumToRender, maxToRenderPerBatch, windowSize y getItemLayout.
- Busqueda de movimientos.
- Filtros por todos, ingresos y gastos.
- useMemo para saldo formateado, lista filtrada y contadores.
- useCallback para renderItem, keyExtractor, refresh y carga de API.
- React.memo a traves de TransactionRow.
- axios mediante fetchExchangeRates.
- Loading con ActivityIndicator.
- Error con RetryState.
- Estado vacio con EmptyState.
- Pull-to-refresh con RefreshControl.
- Cache local de tipos de cambio con AsyncStorage.
- Modal personalizado para mensajes de notificaciones, transferir, promociones, aprobar compras, servicios, cashback y QR.
- Correccion visual del icono de Promos para usar el naranja corporativo `COLORS.primary`.

### `src/screens/SupportScreen.js`

Se optimizo el centro de ayuda.

Conceptos aplicados:

- FlatList para FAQs.
- Busqueda por pregunta y respuesta.
- useMemo para calcular resultados filtrados.
- useCallback para handlers.
- useRef para enfocar el input al limpiar busqueda.
- React.memo a traves de FaqItem.
- Estado vacio cuando no hay coincidencias.

### `src/screens/LoginScreen.js`

Se optimizo el teclado de seguridad sin cambiar su comportamiento.

Conceptos aplicados:

- useCallback para handlers del teclado.
- useMemo para derivar las filas del teclado.
- useEffect mantiene el temporizador de aleatorizacion.
- Aleatorizacion del teclado al entrar a la pantalla de login.
- Aleatorizacion automatica cada 60 segundos.
- Aleatorizacion inmediata cuando el usuario ingresa una clave incorrecta.
- Control de 3 intentos fallidos.
- Bloqueo de ingreso por clave al tercer intento incorrecto.
- Modal personalizado para clave incorrecta y cuenta bloqueada.
- Opciones de recuperacion de clave y centro de ayuda cuando la cuenta queda bloqueada.
- Reduccion visual de los cuadros de acceso rapido de "Olvidaste tu clave" y "Centro de ayuda" para mejorar proporcion y composicion.

### `src/screens/RecoveryEmailScreen.js`

Se reemplazaron las alertas nativas por modales personalizados.

Conceptos aplicados:

- Estado local para configurar el contenido del modal.
- Validacion de correo electronico.
- Modal de correo requerido.
- Modal de correo enviado por Firebase.
- Modal de codigo generado para continuar al paso de verificacion.

### `src/screens/RecoveryCodeScreen.js`

Se reemplazaron las alertas nativas por modales personalizados.

Conceptos aplicados:

- Estado local para configurar el contenido del modal.
- Modal de codigo incompleto.
- Modal de codigo invalido.
- Modal de codigo reenviado.
- Se mantiene useRef para control de inputs OTP.

### `src/screens/NewPasswordScreen.js`

Se reemplazaron las alertas nativas por modales personalizados.

Conceptos aplicados:

- Modal de clave requerida.
- Modal de claves que no coinciden.
- Modal de clave actualizada con accion para volver al login.
- Persistencia del nuevo PIN mediante AuthContext y AsyncStorage.

## 5. Funcionalidades agregadas

- Persistencia del PIN actualizado.
- Persistencia de la preferencia de saldo visible/oculto.
- Persistencia local de movimientos.
- Consumo REST de tipos de cambio referenciales.
- Cache local de datos de API.
- Pull-to-refresh en Home.
- Boton reintentar si falla la API y no hay datos cacheados.
- Estado vacio para movimientos filtrados.
- Estado vacio para busquedas de soporte.
- Listas optimizadas con FlatList.
- Componentes memoizados para reducir renders innecesarios.
- Teclado numerico seguro con numeros aleatorios.
- Bloqueo por 3 intentos fallidos de clave.
- Modales personalizados en lugar de alertas nativas.
- Unificacion visual de mensajes de la app.
- Ajustes de diseno en iconos y tarjetas de acceso rapido.

## 6. Verificaciones realizadas

Se verifico la compilacion del bundle Android con Expo despues de cada bloque importante:

```bash
npx expo export --platform android --output-dir .tmp-export-base
npx expo export --platform android --output-dir .tmp-export-context
npx expo export --platform android --output-dir .tmp-export-home
npx expo export --platform android --output-dir .tmp-export-support
npx expo export --platform android --output-dir .tmp-export-login
npx expo export --platform android --output-dir .tmp-export-icon
npx expo export --platform android --output-dir .tmp-export-login-size
npx expo export --platform android --output-dir .tmp-export-keypad
npx expo export --platform android --output-dir .tmp-export-keypad-error
npx expo export --platform android --output-dir .tmp-export-attempts
npx expo export --platform android --output-dir .tmp-export-modals
```

Resultado: todos los bloques compilaron correctamente.

Nota: la primera ejecucion dentro del sandbox fallo con `spawn EPERM` al generar bytecode Hermes. Se repitio fuera del sandbox y compilo correctamente.

## 7. Conceptos del curso cubiertos

- useState: ya existia y se mantiene en pantallas y contexto.
- useEffect: carga inicial, persistencia y efectos temporizados.
- useRef: animaciones, OTP y enfoque de busqueda en soporte.
- useMemo: datos derivados, filtros, saldo y provider value.
- useCallback: handlers estables y renderItem.
- React.memo: filas de movimientos y FAQs.
- FlatList: movimientos y preguntas frecuentes.
- Busqueda y filtros: Home y Soporte.
- axios: consumo REST en `src/services/api.js`.
- API REST: tipos de cambio publicos desde PEN.
- loading: carga de API en Home.
- error: estado de error con mensaje y reintento.
- estado vacio: movimientos y FAQs sin resultados.
- boton reintentar: error de API sin cache.
- pull-to-refresh: Home.
- AsyncStorage: persistencia local.
- JSON.stringify / JSON.parse: serializacion local.
- optimizacion de listas: keyExtractor, initialNumToRender, maxToRenderPerBatch, windowSize y getItemLayout.
- Modal: componente reutilizable para mensajes y validaciones.
- Seguridad de UI: teclado aleatorio, contador de intentos y bloqueo preventivo.

## 8. Consideraciones

- No se creo otro proyecto.
- No se reemplazo la aplicacion actual.
- No se borraron funcionalidades existentes.
- No se cambio el diseno general.
- No se reemplazo Firebase.
- Los ejemplos de PokeDex, ShoppingList y JSONPlaceholder no fueron copiados como funcionalidad final; los conceptos se adaptaron a la billetera digital.
- Se reemplazaron las alertas nativas por un modal propio para mantener coherencia visual en toda la app.
- La barra visual de intentos fue retirada por solicitud de diseno; el contador queda expresado en texto dentro del modal.
