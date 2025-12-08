export const theme_match_media = window.matchMedia('(prefers-color-scheme: dark)')

export const getSystemTheme = () => (theme_match_media.matches ? 'dark' : 'light')
