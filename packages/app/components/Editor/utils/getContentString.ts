export default (v: string) => (v.startsWith('{') ? JSON.parse(v) : v)
