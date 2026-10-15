# Al Toque — Pantallas y estados del avance 2 para Figma

> Este análisis describe el avance 2 antes de agregar autenticación real. Los cambios posteriores de Login, Registro, Perfil, recuperación y persistencia están documentados en [AUTENTICACION_FIREBASE.md](AUTENTICACION_FIREBASE.md).

## 1. Resultado de la revisión

En el avance 2 NO se agregaron pantallas independientes ni nuevas rutas de navegación. Se actualizaron seis pantallas existentes y se incorporaron secciones, estados visuales y modales personalizados.

La aplicación conserva las siete pantallas del avance 1. Para Figma debes actualizar sus diseños y añadir variantes y overlays que representen las novedades descritas aquí.

Comparación comprobada en Git:
- Avance 1: 3e59985, «avance 1».
- Avance 2: fdbb086, «avance 2, realizado a base de los labs hechos en clase».
- Los seis archivos de pantallas aparecen como modificados (M); no hay pantallas agregadas (A).
- AppNavigator.js conserva siete rutas.

Este archivo contiene una guía textual en formato Markdown (.md). No es un archivo de diseño importable directamente a Figma.

## 2. Pantallas que ya existían

| Pantalla | Ruta | Archivo | Qué corresponde al avance 2 |
| --- | --- | --- | --- |
| Carga inicial / Splash | SPLASH | src/screens/SplashScreen.js | Sin cambios en este avance. |
| Inicio de sesión | LOGIN | src/screens/LoginScreen.js | Ajustes de accesos rápidos, comportamiento del teclado, error y bloqueo. |
| Recuperación por correo / Identificación | RECOVERY_EMAIL | src/screens/RecoveryEmailScreen.js | Modales personalizados de validación y resultado. |
| Verificación de código | RECOVERY_CODE | src/screens/RecoveryCodeScreen.js | Modales personalizados de código incompleto, inválido y reenviado. |
| Nueva clave | NEW_PASSWORD | src/screens/NewPasswordScreen.js | Modales personalizados de validación y confirmación. |
| Centro de ayuda | SUPPORT | src/screens/SupportScreen.js | Búsqueda ampliada, limpieza de búsqueda y estado sin resultados. |
| Inicio / Dashboard | HOME | src/screens/HomeScreen.js | Tipos de cambio, búsqueda y filtros de movimientos, estados de datos y modales informativos. |

## 3. Inicio / Dashboard: principal diseño que debes ampliar

Archivo de referencia: src/screens/HomeScreen.js.
Mockup base existente: mockups/al-toque-home.png.

### 3.1 Nuevo bloque «Tipo de cambio»

Ubicación: debajo del banner de cashback y antes de «Ultimos movimientos».

Elementos:
- Título: «Tipo de cambio».
- Subtítulo actual: «Actualizado desde una API REST publica».
- Tres tarjetas: «Dolar referencial», «Euro referencial» y «Real brasileno referencial».
- Descripción dinámica: «1 USD equivale aprox. a S/ {valor}», y equivalentes para EUR y BRL.
- Icono naranja en círculo claro y franja de acento por tarjeta.
- Acentos: USD #4A90E2, EUR #00A86B y BRL #FFB800.

Los importes dependen de la API; utiliza valores de muestra identificados como referenciales en el diseño. La sección muestra información y no tiene un formulario de cambio de moneda.

Variantes para Figma:

| Nombre sugerido | Apariencia y condición |
| --- | --- |
| A2/Home/TipoCambio-Cargando | Indicador circular naranja junto al encabezado. En la carga inicial aún no hay tarjetas. |
| A2/Home/TipoCambio-Cargado | Tres tarjetas con los tipos de cambio. |
| A2/Home/TipoCambio-ErrorSinCache | Mensaje «No pudimos actualizar el tipo de cambio.», icono de alerta y botón «Reintentar». |
| A2/Home/TipoCambio-Reintentando | El botón cambia a «Reintentando...» y queda deshabilitado; aparece el indicador de carga. |
| A2/Home/TipoCambio-Cache | Se mantienen las tarjetas guardadas y aparece «Mostrando ultimo dato guardado. Desliza para reintentar.». |
| A2/Home/Actualizando | Indicador de actualización al deslizar hacia abajo. Se solicita nuevamente el tipo de cambio. |

Estos estados ocupan una sección de Home; no son páginas de error o carga que reemplacen toda la pantalla. La carga utiliza un indicador circular, no un skeleton.

### 3.2 Búsqueda y filtros de movimientos

Ubicación: después del encabezado de movimientos y antes de la lista.

Elementos añadidos:
- Resumen: «{total} total · {ingresos} ingresos · {gastos} gastos». Son cantidades de movimientos, no sumas monetarias.
- Campo «Buscar movimientos» con lupa.
- Botón «x» visible cuando hay texto, para limpiar la búsqueda.
- Chips «Todos», «Ingresos» y «Gastos».
- Chip seleccionado naranja con texto blanco; los demás con fondo claro y texto secundario.

Comportamiento:
- La búsqueda compara título, fecha e importe escrito del movimiento.
- La búsqueda se combina con el filtro seleccionado.
- El resumen de cantidades corresponde al total de movimientos guardados, no solo a los resultados filtrados.

Variantes:
- A2/Home/Movimientos-Todos: lista completa y chip Todos activo.
- A2/Home/Movimientos-Ingresos: solo ingresos y chip Ingresos activo.
- A2/Home/Movimientos-Gastos: solo gastos y chip Gastos activo.
- A2/Home/Movimientos-Busqueda: texto ingresado, botón x y lista filtrada.
- A2/Home/Movimientos-Vacio: lupa dentro de círculo claro, título «Sin movimientos» y mensaje «Prueba otro texto o cambia el filtro seleccionado.».

### 3.3 Ajustes adicionales

- El icono de Promos pasa a usar el naranja corporativo #FF7A00.
- La preferencia de saldo visible u oculto se conserva al volver a abrir la app.
- La variante oculta muestra «S/ ******». El control de ocultar saldo ya existía en el avance 1.
- La barra inferior se conserva. Movimientos y Tarjetas cambian la selección visual, pero no abren pantallas independientes en el código actual. «Ver todo» selecciona Movimientos.

### 3.4 Nuevos overlays informativos del inicio

Todos usan el mismo componente AppModal sobre Home, con botón «Entendido» que cierra el modal.

| Nombre sugerido | Se abre desde | Título exacto | Mensaje exacto | Icono Feather |
| --- | --- | --- | --- | --- |
| A2/Modal/Notificaciones | Campana | Notificaciones | No tienes notificaciones pendientes. | bell |
| A2/Modal/Transferir | Transferir | Transferir | Modulo de transferencia rapida. | arrow-up-right |
| A2/Modal/Promos | Promos | Promos | Revisa tus promociones exclusivas. | gift |
| A2/Modal/AprobarCompras | Aprobar compras | Aprobar compras | Aprobacion de compras pendientes. | shield |
| A2/Modal/Servicios | Servicios | Servicios | Pago de luz, agua y servicios. | file-text |
| A2/Modal/Cashback | Ver mas del banner | Cashback | Terminos y condiciones del cashback. | gift |
| A2/Modal/QR | Botón QR | Escaner QR Al Toque | Escanea un codigo QR para pagar o cobrar al instante. | camera |

Estos siete elementos son mensajes informativos implementados. El avance 2 no incluye formularios de transferencia, catálogo de promociones, listado de compras pendientes, pago de servicios ni cámara de escaneo QR funcional.

## 4. Inicio de sesión: seguridad y bloqueo

Archivo: src/screens/LoginScreen.js.
Mockup base: mockups/al-toque-login.png.

### 4.1 Actualizar el frame base

- Accesos de «¿Olvidaste tu clave?» y «Centro de ayuda»: cajas de 72 × 72, radio 20 e iconos de 32 × 32.
- Cada contenedor de acceso tiene ancho 88; separación entre accesos: 30.
- Etiquetas debajo de las cajas, tamaño 12 y altura de línea 15.
- Conservar seis puntos de PIN y el teclado inferior naranja.
- El teclado se reorganiza al entrar, cada 60 segundos y después de una clave incorrecta.
- Para representar la reorganización bastan dos variantes con distinto orden de los diez dígitos; se mantiene la distribución de tres columnas y la última fila con Face ID, un número y borrar.

### 4.2 Estados y modales nuevos

| Nombre sugerido | Disparador | Contenido | Acción |
| --- | --- | --- | --- |
| A2/Login/Error-2Intentos | Primer PIN incorrecto de seis dígitos | Icono alert-triangle. Título «Clave incorrecta». Mensaje «La clave ingresada no coincide. Te quedan 2 intentos.». | «Intentar de nuevo»: cerrar modal y permanecer en Login. |
| A2/Login/Error-1Intento | Segundo PIN incorrecto | Mismo modal con «La clave ingresada no coincide. Te quedan 1 intento.». | «Intentar de nuevo»: cerrar modal. |
| A2/Login/CuentaBloqueada | Tercer PIN incorrecto | Icono lock. Título «Cuenta bloqueada». Mensaje «Superaste los 3 intentos permitidos. Para proteger tu cuenta, bloqueamos el ingreso por clave.». | Principal «Recuperar clave» → RECOVERY_EMAIL. Secundario «Centro de ayuda» → SUPPORT. |
| A2/Login/TecladoBloqueado | Login después de cerrar el modal de bloqueo | Teclas numéricas al 50% de opacidad y deshabilitadas. | Accesos a recuperación y soporte disponibles. Face ID vuelve a mostrar el modal de bloqueo. |

El PIN se limpia al fallar. No dibujar una barra de intentos: la documentación indica que fue retirada; el contador solo se comunica en el modal.

El bloqueo actual pertenece al estado local de Login; no se implementa como bloqueo persistente de cuenta en servidor. No añadir un temporizador de desbloqueo al prototipo.

## 5. Recuperación por correo: tres modales personalizados

Archivo: src/screens/RecoveryEmailScreen.js.
Mockup base: mockups/al-toque-identificación.png.

La pantalla ya existía. Las novedades visuales son los overlays que sustituyen alertas nativas.

| Nombre sugerido | Condición | Título y mensaje exactos | Botón y destino |
| --- | --- | --- | --- |
| A2/Correo/Requerido | Correo vacío o sin @ | «Correo requerido». «Por favor ingresa un correo electronico valido.». Icono mail. | «Corregir correo»: cerrar. |
| A2/Correo/EnviadoFirebase | La función informa envío por Firebase | «Correo enviado por Firebase». «Se envio un correo oficial de restablecimiento a {correo}. Revisa tu bandeja de entrada o SPAM.». Icono check-circle. | «Continuar» → RECOVERY_CODE. |
| A2/Correo/CodigoGenerado | La función no informa envío por Firebase | «Codigo enviado». «Se genero tu codigo de verificacion para {correo}.». Icono send. | «Continuar al paso 2» → RECOVERY_CODE. |

Los dos resultados de envío son alternativos; no se muestran uno detrás de otro. La segunda variante refleja el texto actual de la app y no confirma una entrega real por correo.

## 6. Verificación de código: tres modales personalizados

Archivo: src/screens/RecoveryCodeScreen.js.
Mockup base: mockups/al-toque-verificacion.png.

| Nombre sugerido | Condición | Título y mensaje exactos | Botón |
| --- | --- | --- | --- |
| A2/OTP/Incompleto | Verificar con menos de cuatro dígitos | «Codigo incompleto». «Por favor ingresa los 4 digitos del codigo.». Icono key. | «Completar codigo»: cerrar. |
| A2/OTP/Invalido | Código de cuatro dígitos que no coincide | «Codigo invalido». «El codigo ingresado es incorrecto. Revisa los digitos e intenta nuevamente.». Icono alert-triangle. | «Intentar de nuevo»: cerrar. |
| A2/OTP/Reenviado | Finalizar la solicitud de reenvío | «Codigo reenviado». «Se envio una nueva solicitud de verificacion al correo {correo}.». Icono send. | «Entendido»: cerrar. |

Un código válido conduce directamente a NEW_PASSWORD, sin modal de éxito intermedio. El control de reenvío conserva su indicador de carga y espera de 30 segundos; son estados existentes del flujo, no pantallas nuevas del avance 2.

## 7. Nueva clave: tres modales personalizados

Archivo: src/screens/NewPasswordScreen.js.
Mockup base: mockups/al-toque-nueva clave.png.

| Nombre sugerido | Condición | Título y mensaje exactos | Botón y destino |
| --- | --- | --- | --- |
| A2/NuevaClave/Requerida | La clave nueva no tiene seis caracteres | «Clave requerida». «La clave debe ser de exactamente 6 digitos.». Icono key. | «Corregir clave»: cerrar. |
| A2/NuevaClave/NoCoinciden | Confirmación diferente | «Las claves no coinciden». «Verifica que la clave nueva y la confirmacion sean iguales.». Icono alert-triangle. | «Revisar»: cerrar. |
| A2/NuevaClave/Actualizada | Clave aceptada | «Clave actualizada». «Tu clave de Al Toque ha sido cambiada con exito.». Icono check-circle. | «Iniciar sesion» → LOGIN. |

El nuevo PIN se conserva localmente. Esta persistencia no requiere un frame adicional.

## 8. Centro de ayuda: búsqueda sin coincidencias

Archivo: src/screens/SupportScreen.js.
Mockup base: mockups/al-toque-soporte.png.

La búsqueda, los contactos y el acordeón ya estaban en el avance 1. En el avance 2 la búsqueda considera tanto la pregunta como la respuesta y añade un control para limpiarla y un estado vacío explícito.

Variantes que debes representar:
- A2/Soporte/Busqueda: texto escrito, botón x y preguntas coincidentes.
- A2/Soporte/SinResultados: icono search en círculo naranja claro, título «Sin resultados» y mensaje «Intenta con otra palabra o limpia la busqueda.».
- Al pulsar x, se borra el texto, vuelven las preguntas y el campo recupera el foco.

El estado vacío sustituye únicamente la lista de preguntas. La búsqueda, las tarjetas de contacto, el aviso de atención 24/7 y el pie siguen presentes.

Mantener una variante de pregunta expandida para el prototipo, reutilizando el diseño anterior. No contabilizarla como pantalla añadida.

El botón de regreso de Soporte lleva actualmente a LOGIN, incluso si se llegó desde HOME.

## 9. Componente reutilizable de modal para Figma

Referencia: src/components/AppModal.js. Crear un componente con propiedades de título, mensaje, icono, texto principal y botón secundario opcional.

Especificaciones tomadas del código:
- Overlay a pantalla completa: negro al 45% (rgba(0, 0, 0, 0.45)).
- Tarjeta blanca centrada, ancho máximo 340 y margen horizontal mínimo 24 respecto al viewport.
- Radio de tarjeta: 22. Padding horizontal: 22; vertical: 24.
- Círculo de icono: 58 × 58, radio 29, fondo #FFF5EB; icono Feather naranja de 28.
- Título: 20, negrita, centrado, #1C1C1E.
- Mensaje: 14, altura de línea 20, centrado, #6E6E73.
- Botón principal: ancho disponible, alto 48, radio 14, fondo #FF7A00 y texto blanco de 15 en negrita.
- Botón secundario opcional: alto 46, radio 14, borde y texto naranja, fondo blanco y separación superior 10.
- Aparición mediante fade.
- El componente actual no muestra botón x ni implementa cierre al tocar el fondo. No añadir esos controles si buscas reproducirlo fielmente.

Son 18 configuraciones de contenido de modal: 7 de Home, 2 de Login, 3 de correo, 3 de OTP y 3 de nueva clave. Como «Clave incorrecta» tiene dos textos de intentos restantes, la representación exhaustiva produce 19 variantes visibles de overlay.

## 10. Organización sugerida del archivo de Figma

Esta organización es una propuesta para trabajar; los nombres no son rutas adicionales del proyecto.

1. «00 · Base avance 1»: conservar los siete frames originales.
2. «01 · Home avance 2»: frame actualizado y variantes de tipos de cambio, filtros, búsqueda y actualización.
3. «02 · Login avance 2»: accesos ajustados, teclado alternativo y teclado bloqueado.
4. «03 · Recuperación»: reutilizar los tres frames existentes como base de sus overlays.
5. «04 · Soporte avance 2»: búsqueda con resultados y sin resultados.
6. «05 · Componentes»: AppModal, tarjeta de tipo de cambio, chip de filtro, EmptyState y RetryState.
7. «06 · Overlays»: instancias del modal con los 19 estados de contenido descritos.

Usar las dimensiones de los frames del avance 1 para mantener consistencia. Si todavía no hay un tamaño definido, se puede adoptar 390 × 844 como referencia de trabajo; esta medida es una sugerencia, no una dimensión fija de la implementación.

Paleta compartida:
- Primario: #FF7A00.
- Primario oscuro: #E66E00.
- Primario claro: #FFF5EB.
- Texto principal: #1C1C1E.
- Texto secundario: #6E6E73.
- Texto tenue: #8E8E93.
- Blanco: #FFFFFF.
- Borde del tema: #E5E5EA.
- Home utiliza fondo #FBFBFB y algunos bordes #EFEFEF.

Los textos entre comillas reproducen el código actual, incluso cuando faltan tildes o hay errores gramaticales. Cualquier corrección editorial en Figma debe identificarse como propuesta si también se espera actualizar la app después.

## 11. Conexiones del prototipo

- LOGIN + PIN correcto → HOME.
- LOGIN + primer o segundo PIN incorrecto → overlay Clave incorrecta → cerrar → LOGIN.
- LOGIN + tercer PIN incorrecto → overlay Cuenta bloqueada.
- Cuenta bloqueada + Recuperar clave → RECOVERY_EMAIL.
- Cuenta bloqueada + Centro de ayuda → SUPPORT.
- RECOVERY_EMAIL + dato inválido → overlay Correo requerido → cerrar.
- RECOVERY_EMAIL + envío → uno de sus dos overlays de resultado → RECOVERY_CODE.
- RECOVERY_CODE + código incompleto o inválido → overlay correspondiente → cerrar.
- RECOVERY_CODE + código válido → NEW_PASSWORD.
- RECOVERY_CODE + reenviar → overlay Codigo reenviado → cerrar.
- NEW_PASSWORD + datos inválidos → overlay correspondiente → cerrar.
- NEW_PASSWORD + éxito → overlay Clave actualizada → LOGIN.
- HOME + acciones informativas → overlay correspondiente → Entendido → HOME.
- HOME + lupa/filtros → resultados o estado Sin movimientos dentro de HOME.
- HOME + fallo de API sin datos guardados → bloque con Reintentar → carga → resultado o error.
- HOME + fallo de API con datos guardados → tarjetas guardadas y advertencia.
- HOME + deslizar hacia abajo → actualización del tipo de cambio.
- SUPPORT + búsqueda sin coincidencias → Sin resultados; x → lista restaurada.

## 12. Lista de entrega para el avance 2

- [ ] Actualizar Home con tipos de cambio, resumen, búsqueda y filtros.
- [ ] Diseñar sus estados de carga, error, reintento, caché y actualización.
- [ ] Mostrar resultados de búsqueda, ingresos, gastos y lista vacía.
- [ ] Ajustar los accesos rápidos de Login y representar el teclado reorganizado y bloqueado.
- [ ] Crear AppModal reutilizable con uno o dos botones.
- [ ] Preparar sus 19 variantes visibles de contenido, incluida la diferencia de intentos restantes.
- [ ] Añadir búsqueda de soporte con resultados y sin coincidencias.
- [ ] Conectar recuperación, bloqueo, reintento y cierre de overlays.
- [ ] Conservar Splash y reutilizar las demás pantallas base del avance 1.

No es necesario diseñar pantallas adicionales por axios, AsyncStorage, hooks, React.memo o FlatList. Son cambios técnicos; su efecto visual está cubierto por los estados descritos. Tampoco hay nuevas pantallas de Perfil, Tarjetas, registro o historial independiente en este avance.

## 13. Dónde se aplicó lo elaborado en laboratorio

Para la exposición y las diapositivas, consultar [EXPOSICION_LABORATORIOS_AVANCE2.md](EXPOSICION_LABORATORIOS_AVANCE2.md): desarrolla los 13 requisitos individualmente con ubicación en el código, explicación, texto para PPT y pendientes comprobados.

La relación siguiente se basa en los conceptos enumerados en DOCUMENTACION_AVANCE2.md y en su implementación actual. El repositorio no incluye las guías originales ni su numeración; por eso se identifican los laboratorios por tema, sin atribuirles números o títulos no comprobados.

### 13.1 Relación por sección de la aplicación

| Pantalla o sección | Conceptos del laboratorio aplicados | Ubicación concreta en el código | Resultado que debes representar en Figma |
| --- | --- | --- | --- |
| Home · Tipo de cambio | Consumo de API REST con axios, funciones asíncronas y manejo de errores. | src/services/api.js: apiClient, fetchExchangeRates y normalizeRate. src/screens/HomeScreen.js: loadRates y efecto de carga inicial. | Las tres tarjetas referenciales de USD, EUR y BRL. |
| Home · Carga, error y reintento | useState para estados de carga/error, ActivityIndicator y componente de reintento. | HomeScreen.js: ratesLoading, ratesError y loadRates. src/components/RetryState.js. | Indicador circular, mensaje de error y botón Reintentar/Reintentando. |
| Home · Datos guardados del tipo de cambio | AsyncStorage, JSON.stringify y JSON.parse para caché local. | HomeScreen.js: setStoredJson al recibir datos y getStoredJson cuando falla la API. src/services/storage.js: clave storageKeys.offers. | Tarjetas guardadas con advertencia de que no se pudieron actualizar. Aunque la clave se llama offers, guarda tipos de cambio, no promociones. |
| Home · Actualizar deslizando | RefreshControl, estado refreshing y useCallback. | HomeScreen.js: handleRefresh y refreshControl de FlatList. | Indicador de actualización al deslizar hacia abajo y nueva consulta del tipo de cambio. |
| Home · Últimos movimientos | FlatList, keyExtractor y parámetros de renderizado de listas; componente reutilizable con React.memo. | HomeScreen.js: FlatList, renderTransaction, initialNumToRender, maxToRenderPerBatch, windowSize y getItemLayout. src/components/TransactionRow.js. | Lista de movimientos reutilizando una misma fila; estos mecanismos de rendimiento no añaden controles visuales. |
| Home · Buscar y filtrar movimientos | useState, useMemo, filtrado de arreglos y datos derivados. | HomeScreen.js: searchQuery, selectedFilter, filteredTransactions y totals. | Buscador, chips Todos/Ingresos/Gastos y resumen de cantidades. |
| Home · Movimientos sin coincidencias | Renderizado condicional y componente reutilizable para estado vacío. | HomeScreen.js: condición filteredTransactions.length === 0. src/components/EmptyState.js. | Estado «Sin movimientos» dentro de la sección de movimientos. |
| Home · Saldo visible u oculto | useMemo para el saldo formateado; Context y AsyncStorage para conservar la preferencia. | HomeScreen.js: formattedBalance. AuthContext.js: showBalance, toggleBalanceVisibility y efecto de guardado. storage.js: storageKeys.showBalance. | Saldo visible u oculto; la persistencia no añade una pantalla. |
| Soporte · Buscar preguntas frecuentes | useState, useMemo y búsqueda sobre pregunta y respuesta. | src/screens/SupportScreen.js: searchQuery y filteredFaqs. | Resultados filtrados y estado «Sin resultados». |
| Soporte · Limpiar búsqueda | useRef y useCallback para borrar el texto y devolver el foco al campo. | SupportScreen.js: searchInputRef y clearSearch. | Botón x y campo enfocado después de limpiar. |
| Soporte · Lista y acordeón | FlatList, keyExtractor, useCallback y React.memo. | SupportScreen.js: renderFaq, toggleAccordion y expandedId. src/components/FaqItem.js. | Preguntas como componentes reutilizables, con variantes contraída y expandida. El acordeón ya existía; el avance 2 reorganiza y optimiza su implementación. |
| Login · Teclado dinámico | useEffect para temporizador, useCallback para eventos y useMemo para filas del teclado. | src/screens/LoginScreen.js: shuffleNumbers, efecto con setInterval, rows, handleKeyPress, handleDelete y handleFaceId. | Dos disposiciones del teclado para ilustrar la reorganización de dígitos. |
| Login · Intentos fallidos y bloqueo | useState, valores derivados y renderizado condicional. | LoginScreen.js: failedAttempts, isAccountLocked, remainingAttempts y warningVisible. | Modales de clave incorrecta, cuenta bloqueada y teclas deshabilitadas. |
| Login, Home y recuperación · Mensajes | Modal transparente, propiedades reutilizables y estado local para controlar contenido y visibilidad. | src/components/AppModal.js. En las pantallas: modalConfig o warningVisible. | Un componente de modal con variantes de título, mensaje, icono y botones, en lugar de alertas nativas. |
| Recuperación · Correo | useState para campo, carga y configuración del modal; llamada asíncrona al contexto. | src/screens/RecoveryEmailScreen.js: email, loading, modalConfig y handleSubmit. AuthContext.js: requestPasswordReset. | Validación del correo y overlays de resultado. Firebase se conserva del avance 1; la sustitución visual por AppModal corresponde al avance 2. |
| Recuperación · Código OTP | useRef para controlar inputs; useState/useEffect para reenvío y espera; modales de validación. | src/screens/RecoveryCodeScreen.js: inputRefs, handleChangeText, resendCooldown y modalConfig. | Cuatro casillas, foco consecutivo y overlays de código incompleto/reenviado. El control OTP ya existía; los modales personalizados se incorporan en el avance 2. |
| Recuperación · Nueva clave | useState, validación condicional, modal reutilizable y persistencia del PIN. | src/screens/NewPasswordScreen.js: handleChangePin. AuthContext.js: updatePin y efecto de guardado de userPin. | Errores de clave y confirmación «Clave actualizada»; el PIN guardado no requiere otra vista. |

### 13.2 Aplicación transversal: contexto y almacenamiento

Estos conceptos dan soporte a varias pantallas y se pueden explicar con anotaciones junto a los frames de Figma.

| Concepto | Dónde se utiliza | Qué hace en este proyecto |
| --- | --- | --- |
| Context y useContext | src/context/AuthContext.js: AuthProvider y useAuth. | Comparten pantalla actual, PIN, correo, saldo visible y movimientos. El contexto ya estaba en el avance 1; en el avance 2 recibe persistencia y funciones estabilizadas. |
| useEffect | AuthContext.js: hydrateStoredSession y efectos de guardado. | Recupera PIN, preferencia de saldo y movimientos al iniciar; guarda cambios después de terminar la lectura inicial mediante isStorageReady. |
| useCallback | AuthContext.js: requestPasswordReset, verifyOtp, updatePin y toggleBalanceVisibility. | Mantiene estables las referencias de funciones compartidas entre pantallas. También se aplica en los eventos de Home, Soporte y Login. |
| useMemo | AuthContext.js: contextValue. HomeScreen.js: formattedBalance, filteredTransactions, totals y ListHeader. SupportScreen.js: filteredFaqs, ListHeader, ListEmpty y ListFooter. LoginScreen.js: rows. | Conserva resultados derivados o referencias mientras sus dependencias no cambian. |
| AsyncStorage.getItem + JSON.parse | src/services/storage.js: getStoredJson. | Lee y deserializa los valores almacenados, con valor alternativo si faltan datos o hay error. |
| AsyncStorage.setItem + JSON.stringify | src/services/storage.js: setStoredJson. | Serializa y guarda PIN, visibilidad de saldo, movimientos y tipos de cambio. |
| AsyncStorage.removeItem | src/services/storage.js: removeStoredValue. | La función está implementada como utilidad, pero actualmente no se invoca en las pantallas ni en AuthContext. No corresponde a un botón o flujo visual existente. |
| React.memo | src/components/TransactionRow.js y FaqItem.js. | Permite omitir renders de filas cuando sus propiedades no cambian; su efectividad depende de las referencias recibidas. |

Claves de almacenamiento y secciones asociadas:
- @altoque/user-pin → nueva clave y lectura del PIN usado en Login.
- @altoque/show-balance → tarjeta de saldo de Home.
- @altoque/transactions → lista de últimos movimientos de Home.
- @altoque/offers → caché de tarjetas de tipo de cambio de Home.

### 13.3 Anotaciones listas para colocar en Figma

- Junto a Tipo de cambio: «Laboratorio: API REST con axios; carga asíncrona, manejo de errores y caché con AsyncStorage».
- Junto a Últimos movimientos: «Laboratorio: FlatList, búsqueda y filtros con useMemo; filas reutilizables con React.memo».
- Junto al control de saldo: «Laboratorio: preferencia guardada con AsyncStorage y compartida mediante Context».
- Junto al gesto de actualización: «Laboratorio: RefreshControl y useCallback para volver a consultar la API».
- Junto a la búsqueda de soporte: «Laboratorio: filtro con useMemo, limpieza y enfoque con useRef».
- Junto al acordeón de preguntas: «Laboratorio: FlatList y componente FaqItem memoizado».
- Junto al teclado de Login: «Laboratorio: useEffect para reorganización periódica, useMemo para las filas y useCallback para eventos».
- Junto a los modales: «Laboratorio: componente Modal reutilizable y renderizado condicional con useState».
- Junto a Nueva clave: «Laboratorio: actualización del estado global y persistencia local del PIN con JSON.stringify/JSON.parse».

### 13.4 Alcance comprobado y precisión para la exposición

- Los movimientos se inicializan con datos de ejemplo y se guardan localmente. No provienen de una API bancaria.
- La API REST incorporada se usa para tipos de cambio; no para ejecutar transferencias o pagar servicios.
- Pull-to-refresh vuelve a consultar tipos de cambio; no descarga movimientos nuevos.
- Los conceptos de laboratorio se adaptaron a la billetera. La documentación indica que no se copiaron PokeDex, ShoppingList ni JSONPlaceholder como módulos del producto.
- La función verifyOtp del contexto actual acepta cualquier cadena de cuatro caracteres. Por ello, el modal «Codigo invalido» está definido en la pantalla, pero no se alcanza con un código de cuatro dígitos en esta implementación. En Figma puede documentarse como variante prevista, identificándola como tal. Los recorridos anteriores que mencionan un código que «no coincide» describen esa intención visual, no una validación real implementada.
- El documento describe el código; no se realizaron cambios funcionales ni nuevas pruebas de ejecución para esta ampliación de la guía.

## 14. Fuentes del análisis

- DOCUMENTACION_AVANCE1.md y DOCUMENTACION_AVANCE2.md.
- Comparación Git entre 3e59985 y fdbb086.
- src/navigation/AppNavigator.js.
- src/screens/HomeScreen.js y LoginScreen.js.
- src/screens/RecoveryEmailScreen.js, RecoveryCodeScreen.js y NewPasswordScreen.js.
- src/screens/SupportScreen.js.
- src/components/AppModal.js, EmptyState.js y RetryState.js.
- src/services/api.js y src/theme/colors.js.

Se consultó también la documentación versionada requerida por AGENTS.md: https://docs.expo.dev/versions/v57.0.0/. Las conclusiones sobre pantallas proceden de los documentos, el historial y el código local del proyecto.
