export default (target_obj: any) => {
	Object.keys(target_obj).forEach(key_name => {
		delete target_obj[key_name]
	})
}
