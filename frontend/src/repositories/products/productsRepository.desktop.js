import {
  normalizeDesktopProductPayload,
  normalizeDesktopProductRecord,
} from '@/repositories/desktopAdapters'

const MAX_DESKTOP_IMAGE_SIZE_BYTES = 2 * 1024 * 1024

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Unable to read the selected image file.'))
    reader.readAsDataURL(file)
  })

const prepareDesktopProductPayload = async (payload) => {
  const source = payload instanceof FormData ? new FormData(payload) : { ...(payload || {}) }
  const imageValue = payload instanceof FormData ? payload.get('image') : payload?.image

  if (imageValue instanceof File) {
    if (imageValue.size > MAX_DESKTOP_IMAGE_SIZE_BYTES) {
      throw new Error('Desktop product images must be 2 MB or smaller.')
    }

    const imageDataUrl = await fileToDataUrl(imageValue)

    if (source instanceof FormData) {
      source.delete('image')
      source.set('image_url', imageDataUrl)
    } else {
      delete source.image
      source.image_url = imageDataUrl
    }
  }

  return normalizeDesktopProductPayload(source)
}

export const createDesktopProductsRepository = () => ({
  async list(filters = {}) {
    const response = await window.ordersync.listProducts(filters)
    return (response?.items || []).map(normalizeDesktopProductRecord)
  },
  async create(payload) {
    const response = await window.ordersync.createProduct(await prepareDesktopProductPayload(payload))
    return normalizeDesktopProductRecord(response)
  },
  async update(entityId, data) {
    const response = await window.ordersync.updateProduct({
      entityId,
      data: await prepareDesktopProductPayload(data),
    })
    return normalizeDesktopProductRecord(response)
  },
  async remove(entityId) {
    const response = await window.ordersync.deleteProduct(entityId)
    return normalizeDesktopProductRecord(response)
  },
})
