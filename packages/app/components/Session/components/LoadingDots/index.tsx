import styles from './index.module.css'

const Index = () => {
	return (
		<div className={$cx('flex items-center', styles._local)}>
			<span className='dot' />
			<span className='dot' />
			<span className='dot' />
		</div>
	)
}

export default $app.memo(Index)
