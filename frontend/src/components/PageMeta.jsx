import { useEffect } from 'react'

function PageMeta({ title, description }) {
  useEffect(() => {
    const previousTitle = document.title
    const meta = document.querySelector('meta[name="description"]')
    const previousDescription = meta?.getAttribute('content') || ''

    document.title = title

    if (meta) {
      meta.setAttribute('content', description)
    } else {
      const newMeta = document.createElement('meta')
      newMeta.name = 'description'
      newMeta.content = description
      document.head.appendChild(newMeta)
    }

    return () => {
      document.title = previousTitle
      const currentMeta = document.querySelector('meta[name="description"]')
      if (currentMeta) {
        currentMeta.setAttribute('content', previousDescription)
      }
    }
  }, [description, title])

  return null
}

export default PageMeta
