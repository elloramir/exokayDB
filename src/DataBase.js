const Collection = require("./Collection");

class DataBase {
	constructor(dir = ".") {
		this.dir = dir;
		this.collections = new Map();
		this.queuePool = new Map();
	}

	// Lazily create or return existing Collection instance (no underscore)
	getOrCreateCollection(collectionName) {
		if (!this.collections.has(collectionName)) {
			const coll = new Collection(collectionName, this.dir);
			this.collections.set(collectionName, coll);
		}
		return this.collections.get(collectionName);
	}

	// Serialize operations per collectionName (no underscore)
	async toEnqueue(collectionName, operationFn) {
		if (!this.queuePool.has(collectionName)) {
			this.queuePool.set(collectionName, Promise.resolve());
		}

		const queueHead = this.queuePool.get(collectionName);
		const queueTail = queueHead.then(async () => {
			const collection = this.getOrCreateCollection(collectionName);
			return operationFn(collection);
		});

		this.queuePool.set(collectionName, queueTail);
		return queueTail;
	}

	// Insert a JSON object into the given collection
	// (appends a line in NDJSON).
	async insert(collectionName, jsonData) {
		return this.toEnqueue(collectionName, async (collection) => {
			return collection.append(jsonData);
		});
	}

	// Find all or matching records in a collection.
	// Filtering (exact‐match) happens here, in the database layer.
	async find(collectionName, query = {}) {
		return this.toEnqueue(collectionName, async (collection) => {
			const results = [];
			for await (const obj of collection.readLines()) {
				if (Object.keys(query).length === 0) {
					results.push(obj);
				} else {
					const matches = Object.entries(query).every(
						([key, value]) => obj[key] === value
					);
					if (matches) results.push(obj);
				}
			}
			return results;
		});
	}

	// Clear (truncate) an entire collection.
	async clear(collectionName) {
		return this.toEnqueue(collectionName, async (collection) => {
			return collection.clear();
		});
	}
}

module.exports = DataBase;
