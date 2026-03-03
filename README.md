# 🌱 Plantify

Aplicación móvil desarrollada con *React Native (Expo)* para la gestión, seguimiento y cuidado inteligente de plantas.

Plantify permite a los usuarios registrar sus plantas, llevar un control de cuidados (riego, fertilización, poda, etc.), recibir recordatorios automáticos y mantener un historial detallado para mejorar la salud de sus cultivos domésticos.

---

## 📱 Descripción del Proyecto

Plantify nace como una solución digital para personas que desean:

* Organizar el cuidado de sus plantas.
* Evitar olvidos en riego o mantenimiento.
* Llevar un historial estructurado de cada planta.
* Digitalizar el seguimiento del crecimiento y estado vegetal.

La aplicación está orientada a usuarios domésticos, estudiantes y personas interesadas en el cuidado de plantas ornamentales o huertas urbanas.

---

## 🚀 Tecnologías Utilizadas

* ⚛ *React Native*
* 📦 *Expo*
* 🔥 *Firebase*

  * Firebase Authentication
  * Cloud Firestore
  * Firebase Storage
* 🧭 *Expo Router* (estructura de navegación)
* 🟨 JavaScript (ES6+)

---

## 🏗️ Arquitectura del Proyecto

El proyecto sigue una arquitectura modular por capas:

### 1️⃣ Capa de Presentación (UI)

* Pantallas (app/)
* Componentes reutilizables
* Navegación con Expo Router

### 2️⃣ Capa de Dominio

* Reglas de negocio
* Validaciones
* Lógica relacionada con plantas y cuidados

### 3️⃣ Capa de Datos

* Servicios de Firebase
* Conexión con Firestore
* Gestión de autenticación
* Almacenamiento de imágenes

---

## 🔜 Funcionalidades en Desarrollo

* 🔔 Recordatorios con notificaciones
* 📅 Calendario de cuidados
* 🌿 Identificación de plantas mediante cámara
* 📊 Estadísticas de cuidado

---

## ⚙️ Instalación y Ejecución

### 1️⃣ Clonar el repositorio

bash
git clone https://github.com/DavidAl12/Plantify.git
cd Plantify


### 2️⃣ Instalar dependencias

bash
npm install


o

bash
yarn install


### 3️⃣ Configurar Firebase

Crear un archivo .env o configurar las variables de entorno con:

* API_KEY
* AUTH_DOMAIN
* PROJECT_ID
* STORAGE_BUCKET
* MESSAGING_SENDER_ID
* APP_ID

(Estas credenciales se obtienen desde la consola de Firebase.)

### 4️⃣ Ejecutar el proyecto

bash
npx expo start


Luego escanear el QR con *Expo Go* o ejecutar en emulador Android/iOS.

---

## 👨‍💻 Autor

*David Alpala*
*Catalina Estrada*
Estudiantes de Ingeniería de Sistemas
Universidad Santiago de Cali
