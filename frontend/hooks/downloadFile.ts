export function downloadFile(file: string, alterName: string) {
  const link = document.createElement('a')
  link.href = file
  link.download = alterName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}