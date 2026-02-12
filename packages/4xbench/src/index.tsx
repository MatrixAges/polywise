import React from 'react'
import ReactDOM from 'react-dom/client'

const App = () => (
	<div style={{ padding: 20, fontFamily: 'sans-serif' }}>
		<h1>4xBench</h1>
		<p>Welcome to 4xBench.</p>
	</div>
)

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
)
