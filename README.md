# 📊 APLICACIÓN GESTIÓN DE DATOS PERSONALES

**Sistema de microservicios para gestión de información personal con autenticación SSO, RAG/LLM y arquitectura cloud-native**

[![Docker](https://img.shields.io/badge/Docker-20%2B-blue.svg)](https://www.docker.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-green.svg)](https://www.mongodb.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)

---

## 📋 TABLA DE CONTENIDOS

1. [Descripción del Proyecto](#-descripción-del-proyecto)
2. [Arquitectura](#-arquitectura)
3. [Requisitos Previos](#️-requisitos-previos)
4. [Instalación Rápida](#-instalación-rápida)
5. [Endpoints Principales](#-endpoints-principales)

---

## 🎯 DESCRIPCIÓN DEL PROYECTO

Sistema enterprise para **gestión de datos personales** desarrollado en arquitectura de microservicios.

### Características Principales

- **Autenticación SSO**: Integración con Microsoft Entra ID (OAuth2/OIDC).
- **Gestión de Usuarios**: CRUD completo con validaciones y almacenamiento de fotos en Azure.
- **Consultas Inteligentes (RAG)**: Motor de búsqueda con lenguaje natural potenciado por LLM.
- **Auditoría**: Sistema de logs centralizado basado en eventos.
- **Arquitectura Escalable**: Microservicios independientes orquestados con Docker.

---

## 🏛️ ARQUITECTURA

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │ HTTP/HTTPS
       ▼
┌─────────────────────────────────────┐
│   Nginx Gateway (:80)               │
└────┬────┬────┬────┬─────────────────┘
     │    │    │    │
┌────▼────▼────▼────▼──────┐
│  Microservicios          │
│  ┌─────────────────────┐ │
│  │ Auth Service :8000  │ │◄── Microsoft Entra ID
│  └─────────────────────┘ │
│  ┌─────────────────────┐ │
│  │ User CRUD :8080     │ │
│  └─────────────────────┘ │
│  ┌─────────────────────┐ │
│  │ Query Service :8081 │ │◄── OpenRouter LLM
│  └─────────────────────┘ │
│  ┌─────────────────────┐ │
│  │ Log Service :8082   │ │
│  └─────────────────────┘ │
└──────────┬───────────────┘
           │
    ┌──────┴─────┬────────┬─────────┐
    │            │        │         │
┌───▼───┐  ┌────▼─┐  ┌───▼───┐  ┌──▼─────┐
│MongoDB│  │Redis │  │RabbitMQ│ │  Azure  │
│ :27017│  │:6379 │  │ :5672  │ │ Storage │
└───────┘  └──────┘  └────────┘  └─────────┘
```

---

## ⚙️ REQUISITOS PREVIOS

- **Docker Desktop** 20+
- **Credenciales**:
  - Microsoft Entra ID (Client ID, Tenant ID, Secret)
  - OpenRouter API Key (para RAG)
  - Azure Storage Connection String (para fotos)

---

## 🚀 INSTALACIÓN RÁPIDA

### 1. Clonar Repositorio

```bash
git clone https://github.com/OmarCifuentes/Desing-II
cd ProyectoFinal
```

### 2. Configurar Variables de Entorno

```bash
cp .env.template .env
```

Editar `.env` con tus credenciales.

### 3. Iniciar Sistema Completo

```bash
docker-compose up -d
```

### 4. Verificar Estado

```bash
docker-compose ps
```

---

## 🌐 ENDPOINTS PRINCIPALES

**Base URL**: `http://localhost`

### 🔐 Autenticación
- `GET /auth/login` - Iniciar sesión (SSO)
- `GET /auth/verify` - Verificar token

### 👤 Usuarios
- `POST /user` - Crear usuario
- `GET /user/{documento}` - Consultar usuario
- `PATCH /user/{documento}` - Actualizar usuario
- `DELETE /user/{documento}` - Eliminar usuario

### 🤖 Consultas Inteligentes
- `POST /query/consulta` - Preguntar en lenguaje natural
  - *"¿Cuántos usuarios hay?"*
  - *"¿Quién es el más joven?"*
  - *"Lista usuarios masculinos"*

### 📜 Auditoría
- `GET /logs` - Consultar logs del sistema

---

##  AUTORES

- **Omar Dario Cifuentes Laverde** - 200152245
- **Camilo Andrés De la Rosa Castañeda** - 200176849
- **Jesús David García Vargas** - 200180806
- **Ana Yulieth Gil Carcamo** - 200177662

---

**Universidad del Norte - Diseño de Software II - 2025**
