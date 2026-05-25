# 🌱 Perflora

Aplicación móvil desarrollada con React Native (Expo) para la gestión inteligente, identificación y cuidado personalizado de plantas.
Perflora permite a los usuarios registrar sus plantas, hacer seguimiento de cuidados, recibir recomendaciones inteligentes y utilizar herramientas como identificación mediante imagen y contenido informativo automatizado.

---

## 📱 Descripción del Proyecto

Perflora es una solución digital enfocada en el cuidado moderno de plantas, que combina:

* Gestion de plantas personales
* Seguimiento de cuidados (riego, poda, fertilización)
* Sugerencias inteligentes basadas en datos
* Identificación de plantas mediante cámara
* Información enriquecida desde fuentes externas

Está orientada a usuarios domésticos, estudiantes y entusiastas de la jardinería urbana que buscan digitalizar y optimizar el cuidado de sus plantas.

---

## 🚀 Tecnologías Utilizadas

### 📱Frontend:

* ⚛ *React Native*
* 📦 *Expo*
* 🧭 *Expo Router (navegación basada en archivos)*

### 🔥 Backend / Servicios:
* *Firebase*
  * *Authentication*
  * *Cloud Firestore*
  * *Storage*

### 🌐 Integraciones y APIs:
* ☁ Cloudinary (gestión de imágenes)
* 🌍 API de Wikipedia (información de plantas)
* 🌐 Servicios de traducción automática

### 🧠 Lógica y Arquitectura:
* JavaScript (ES6+)
* Arquitectura modular por capas
* Separación en servicio, utils y dominio

---

## 🏗️ Arquitectura del Proyecto

El proyecto sigue una arquitectura escalable organizada por capas:

### 1️⃣ Capa de Presentación (UI)

Ubicación: <mark>app/</mark> y <mark>components/</mark>
* *Navegación con Expo Router*
* *Pantallas organizadas por modulos:*
  * *<mark>(auth)</mark> -> Autenticación*
  * *<mark>(tabs)</mark> -> Navegación principal*
  * *<mark>plant/</mark> -> Gestión de plantas*
  * *<mark>onboarding/</mark>*
* Navegación con Expo Router
  * *UI (Button, Input, ScreenContainer)*
  * *Plantas (PlantCard, PlantList)*
  * *Layout (Header, TabBar)*

### 2️⃣ Capa de Dominio
Ubicación: <mark>src/domain/</mark>
* *Reglas de negocio*
* *Validaciones*
* *Lógica relacionada con plantas y cuidados*

### 3️⃣ Capa de Datos
Ubicación: <mark>src/services/</mark>
  * *<mark>plantService.js</mark> -> Api plantas*
  * *<mark>cloudinaryService.js</mark> -> Subida de imágines*
  * *<mark>wikipediaService.js</mark> -> Obtención de información*
  * *<mark>translationService.js</mark> -> traducción de contenido* 

---
## 🌟 Funcionalidades Principales
* 🔐 Autenticación de usuarios
* 🌱 Registro y gestión de plantas
* 📷 Captura e identificación de plantas
* 🧠 Sugerencias inteligentes de cuidado
* 📊 Historial de cuidados
* 📅 Vista tipo calendario (en desarrollo/mejora)
* 🔔 Notificaciones y recordatorios inteligentes
* 📊 Estadísticas avanzadas de cuidado
---

## ⚙️ Instalación y Ejecución

### 1️⃣ Clonar el repositorio

bash
git clone https://github.com/DavidAl12/Perflora.git
cd Perflora


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


Luego: 
* Escanear el QR con *Expo Go*
* o ejecutar en emulador Android/iOS.

---

## 👨‍💻 Autor

* *Arley David Alpala Benavides*
* *Catalina Estrada Rivas*
  
Estudiantes de Ingeniería de Sistemas
Universidad Santiago de Cali
