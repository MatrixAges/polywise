export default (last_interaction: number, idle_timeout: number) => Date.now() - last_interaction > idle_timeout
