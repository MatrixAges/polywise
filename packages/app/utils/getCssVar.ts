export default (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
