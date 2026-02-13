export const react_optimization_chat: Array<string> = [
	'My React application is experiencing significant performance issues, especially when rendering large lists. Can you help me optimize it?',
	'It is a dashboard application that displays a data table with thousands of rows. The table has sorting and filtering features.',
	'Here is a simplified version of the component:\n```jsx\nfunction DataTable({ data }) {\n  const [filter, setFilter] = useState("");\n  const filteredData = data.filter(d => d.name.includes(filter));\n  return (\n    <div>\n      <input value={filter} onChange={e => setFilter(e.target.value)} />\n      {filteredData.map(row => <div key={row.id}>{row.name}</div>)}\n    </div>\n  );\n}\n```\nWhat is wrong with this?',
	'The `filteredData` calculation runs on every render. How can I fix that?',
	'I see. But the input field also feels sluggish when typing. Why is that?',
	'How can I implement debouncing for the search input to improve responsiveness?',
	'Can you show me a code example using `lodash.debounce` or a custom hook?',
	'That helps. However, the initial render is still slow because of the DOM nodes. What can I do?',
	'I have heard of windowing. Which library do you recommend for React?',
	'I will try `react-window`. How do I integrate it with my `filteredData`?',
	'If the rows have variable heights, does `react-window` still work?',
	'Great. Are there any other performance tips for this table component, maybe regarding re-renders of rows?',
	'Thank you. Please summarize the optimization steps we discussed.'
]
