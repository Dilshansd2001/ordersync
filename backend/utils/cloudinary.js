const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const cloudinary = require('cloudinary').v2
const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
)
const isCloudinaryExplicitlyEnabled = process.env.CLOUDINARY_ENABLED === 'true'
const shouldUseCloudinary = hasCloudinaryConfig && isCloudinaryExplicitlyEnabled

if (shouldUseCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

const createStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    },
  })

const localUploadStorage = (folderName) =>
  multer.diskStorage({
    destination: (req, file, callback) => {
      const uploadDirectory = path.join(__dirname, '..', 'uploads', folderName)
      fs.mkdirSync(uploadDirectory, { recursive: true })
      callback(null, uploadDirectory)
    },
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname || '').toLowerCase() || '.bin'
      callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`)
    },
  })

const imageFileFilter = (req, file, callback) => {
  if (file.mimetype?.startsWith('image/')) {
    callback(null, true)
    return
  }

  callback(new Error('Only image uploads are allowed.'))
}

const createUploader = (cloudinaryFolder, localFolder) =>
  multer({
    storage: shouldUseCloudinary ? createStorage(cloudinaryFolder) : localUploadStorage(localFolder),
    fileFilter: imageFileFilter,
  })

const buildFileUrl = (req, file) => {
  if (!file) {
    return ''
  }

  if (file.path && /^https?:\/\//i.test(file.path)) {
    return file.path
  }

  if (file.filename) {
    const folderName = file.destination ? path.basename(file.destination) : ''
    if (folderName) {
      return `${req.protocol}://${req.get('host')}/uploads/${folderName}/${file.filename}`
    }
  }

  return file.path || ''
}

const businessLogoUpload = createUploader('ordersync/business-logos', 'business-logos')
const productImageUpload = createUploader('ordersync/products', 'products')

module.exports = {
  buildFileUrl,
  cloudinary,
  businessLogoUpload,
  hasCloudinaryConfig,
  productImageUpload,
  shouldUseCloudinary,
}
