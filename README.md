# Sistema POS Heladería

Sistema de punto de venta completo para heladería con Firebase integrado.

## Características

- **Dashboard**: Estadísticas de ventas en tiempo real
- **Punto de Venta**: Sistema completo de ventas con carrito
- **Inventario**: Control de stock y productos
- **Créditos**: Gestión de clientes y pagos a crédito
- **Firebase**: Persistencia de datos en tiempo real

## Tecnologías

- React + TypeScript
- Firebase Firestore
- Vite
- CSS moderno con gradientes

## Funcionalidades

### Dashboard
- Estadísticas de ventas del día
- Ventas por método de pago
- Historial de ventas recientes
- Alertas de stock bajo

### Punto de Venta
- Catálogo de productos con búsqueda
- Carrito de compras funcional
- Selección de clientes
- Métodos de pago: efectivo, transferencia, crédito
- Actualización automática de inventario

### Inventario
- Listado completo de productos
- Agregar nuevos productos
- Reabastecer stock
- Alertas de stock bajo
- Eliminar productos

### Créditos
- Gestión de clientes
- Registro de deudas
- Procesamiento de pagos
- Historial de transacciones
- Estadísticas de créditos

## Instalación

1. Clona el repositorio
2. Instala dependencias: `npm install`
3. Configura Firebase en `src/config/firebase.ts`
4. Ejecuta: `npm run dev`

## Configuración Firebase

1. Crea un proyecto en Firebase Console
2. Habilita Firestore Database
3. Configura las reglas de seguridad
4. Actualiza la configuración en `firebase.ts`

## Estructura del Proyecto

```
src/
├── components/          # Componentes React
├── config/             # Configuración Firebase
├── hooks/              # Hooks personalizados
├── services/           # Servicios Firebase
├── types/              # Tipos TypeScript
└── data/               # Datos iniciales
```

## Uso

1. **Login**: Selecciona un vendedor para iniciar sesión
2. **Dashboard**: Ve las estadísticas del día
3. **Ventas**: Agrega productos al carrito y procesa ventas
4. **Inventario**: Gestiona productos y stock
5. **Créditos**: Administra clientes y pagos

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## Licencia

MIT License
