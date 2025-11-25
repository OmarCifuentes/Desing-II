const { BlobServiceClient } = require('@azure/storage-blob');
const sharp = require('sharp');

/**
 * Servicio para gestionar uploads de fotos a Azure Blob Storage
 */
class PhotoUploadService {
  constructor() {
    // Conectar a Azure usando connection string del .env
    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    this.containerName = 'photos'; // Nombre del contenedor en Azure
  }

  /**
   * Inicializar contenedor (crear si no existe)
   * Llamar a la inicio del servicio
   */
  async initialize() {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName
      );

      // Crear contenedor si no existe (PRIVADO por defecto para evitar error de acceso público)
      await containerClient.createIfNotExists();

      console.log(`Azure Blob Storage: Contenedor '${this.containerName}' listo`);
    } catch (error) {
      console.error('Error inicializando Azure Storage:', error.message);
      // No lanzar error para no tumbar el servicio si Azure falla, pero loguear
    }
  }

  /**
   * Subir foto a Azure Blob Storage
   * @param {Buffer} fileBuffer - Archivo en memoria (desde multer)
   * @param {string} documentId - ID del usuario para nombre único
   * @param {string} originalMimetype - Tipo MIME original
   * @returns {Promise<Object>} {photoUrl, size, format}
   */
  async uploadPhoto(fileBuffer, documentId, originalMimetype) {
    try {
      // PASO 0: Validar tamaño del archivo ORIGINAL antes de procesar
      const originalSizeInMB = fileBuffer.length / (1024 * 1024);
      console.log(`Foto original: ${originalSizeInMB.toFixed(2)} MB`);

      // Rechazar archivos muy grandes ANTES de procesarlos
      if (originalSizeInMB > 5) {
        throw new Error(
          `Foto original demasiado grande: ${originalSizeInMB.toFixed(2)} MB. ` +
          `Máximo permitido: 5MB antes de optimización. ` +
          `Por favor, reduce el tamaño de la imagen antes de subirla.`
        );
      }

      // PASO 1: Optimizar imagen con Sharp
      console.log(`Procesando foto para usuario ${documentId}...`);

      const optimizedBuffer = await sharp(fileBuffer)
        .resize(1024, 1024, {
          fit: 'inside', // Mantener aspect ratio
          withoutEnlargement: true, // No agrandar si ya es pequeña
        })
        .webp({ quality: 80 }) // Convertir a WebP (mejor compresión)
        .toBuffer();

      // PASO 2: Verificar tamaño final ≤ 2MB (requisito del enunciado)
      const sizeInBytes = optimizedBuffer.length;
      const sizeInMB = sizeInBytes / (1024 * 1024);

      if (sizeInMB > 2) {
        throw new Error(
          `Foto optimizada excede el límite: ${sizeInMB.toFixed(2)} MB. ` +
          `Máximo permitido: 2MB. Intenta con una imagen de menor resolución.`
        );
      }

      console.log(`Foto optimizada: ${sizeInMB.toFixed(2)} MB`);

      // PASO 3: Generar nombre único
      const timestamp = Date.now();
      const blobName = `${documentId}-${timestamp}.webp`;

      // PASO 4: Subir a Azure
      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName
      );
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(optimizedBuffer, sizeInBytes, {
        blobHTTPHeaders: {
          blobContentType: 'image/webp',
        },
      });

      // PASO 5: Generar SAS Token (para acceso temporal seguro)
      // Nota: En producción idealmente se genera on-demand, pero aquí generamos uno de larga duración
      // para simplificar el almacenamiento de la URL.
      const sasToken = await this.generateSasToken(blobName);
      const photoUrl = `${blockBlobClient.url}?${sasToken}`;

      console.log(`Foto subida exitosamente`);

      return {
        photoUrl,
        size: sizeInBytes,
        sizeInMB: sizeInMB.toFixed(2),
        format: 'webp',
        blobName,
      };
    } catch (error) {
      console.error('Error subiendo foto a Azure:', error);

      if (error.code === 'ENOTFOUND') {
        throw new Error(
          'Error de conexión con Azure Storage. Verifica AZURE_STORAGE_CONNECTION_STRING.'
        );
      }

      throw new Error(`Error al subir foto: ${error.message}`);
    }
  }

  /**
   * Generar SAS Token para lectura
   */
  async generateSasToken(blobName) {
    const {
      generateBlobSASQueryParameters,
      BlobSASPermissions,
      StorageSharedKeyCredential,
    } = require('@azure/storage-blob');

    // Extraer credenciales del connection string (hacky pero efectivo si no tenemos la key separada)
    // Asumimos que el connection string tiene AccountName y AccountKey
    const connString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const accountNameMatch = connString.match(/AccountName=([^;]+)/);
    const accountKeyMatch = connString.match(/AccountKey=([^;]+)/);

    if (!accountNameMatch || !accountKeyMatch) {
      console.warn(
        'No se pudo generar SAS Token: Faltan credenciales en connection string'
      );
      return '';
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountNameMatch[1],
      accountKeyMatch[1]
    );

    const sasOptions = {
      containerName: this.containerName,
      blobName: blobName,
      permissions: BlobSASPermissions.parse('r'), // Read only
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 365 * 24 * 60 * 60 * 1000), // 1 año
    };

    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      sharedKeyCredential
    ).toString();
    return sasToken;
  }

  /**
   * Eliminar foto de Azure (cuando se borra usuario)
   * @param {string} photoUrl - URL completa de la foto
   */
  async deletePhoto(photoUrl) {
    try {
      if (!photoUrl || !photoUrl.includes('blob.core.windows.net')) {
        return; // No es una foto de Azure
      }

      // Extraer blob name de URL
      const url = new URL(photoUrl);
      const pathParts = url.pathname.split('/');
      const blobName = pathParts.slice(2).join('/');

      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName
      );
      const blobClient = containerClient.getBlobClient(blobName);

      const deleted = await blobClient.deleteIfExists();

      if (deleted) {
        console.log(`Foto eliminada de Azure: ${blobName}`);
      }
    } catch (error) {
      console.error('Error eliminando foto de Azure:', error.message);
      // No lanzar error (foto puede no existir)
    }
  }

  /**
   * Verificar si una URL es de nuestro Azure Storage
   * @param {string} photoUrl - URL a verificar
   * @returns {boolean}
   */
  isAzureUrl(photoUrl) {
    if (!photoUrl) return false;

    // Extraer account name del connection string
    const accountName = this.blobServiceClient.accountName;
    return photoUrl.includes(`${accountName}.blob.core.windows.net`);
  }
}

// Exportar instancia singleton
module.exports = new PhotoUploadService();
