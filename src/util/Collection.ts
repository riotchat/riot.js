export default class Collection<K, V> extends Map<K, V> {
	array() {
		return Array.from(this.entries());
	}
}