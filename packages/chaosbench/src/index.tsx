import React from 'react'
import ReactDOM from 'react-dom/client'

const App = () => (
	<div style={{ padding: 20, fontFamily: 'sans-serif' }}>
		<h1>ChaosBench</h1>
		<p>Welcome to ChaosBench.</p>
	</div>
)

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
)
