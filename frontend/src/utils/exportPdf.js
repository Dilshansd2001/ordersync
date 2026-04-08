export const exportPdf = () => {
  document.body.classList.add('report-print-mode')

  const cleanup = () => {
    document.body.classList.remove('report-print-mode')
    window.removeEventListener('afterprint', cleanup)
  }

  window.addEventListener('afterprint', cleanup)
  window.print()
}

export default exportPdf
