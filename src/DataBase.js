const fs = require("fs");
const asyncFS = fs.promises;

class DataBase
{
	constructor() {
		this.collections = new Map();
		this.queuePool = new Map();
	}

	async populateFromDisk(collectionName)
	{
		const content = await asyncFS.readFile(collectionName).catch(err => "[]");
		const jsonData = JSON.parse(content);

		this.collections.set(collectionName, jsonData);
		return jsonData;
	}

	async saveCollection(collectionName, collection=null)
	{
		if (!collection) {
			collection = this.getCollection(collectionName);
		}

		await asyncFS.writeFile(collectionName, JSON.stringify(collection));
	}

	async getCollection(collectionName) {
		let collection = this.collections.get(collectionName);

		// Let's create that collection if it is the first time here!
		if (!collection) {
			collection = await this.populateFromDisk(collectionName);
		}

		return collection;
	}

	async toEnqueue(collectionName, closureOperation)
	{
		// For context we should only wait for operations
		// on our collection page to finish.
		if (!this.queuePool.has(collectionName)) {
			this.queuePool.set(collectionName, Promise.resolve());
		}

		const collection = await this.getCollection(collectionName);
		const queueHead = this.queuePool.get(collectionName);
		const queueTail = queueHead.then(async () => {
			const res = await closureOperation(collection);

			// Allways propagate the changes into our disk
			await this.saveCollection(collectionName, collection);

			return res;
		});

		this.queuePool.set(collectionName, queueTail);
		return queueTail;
	}

	// @TODO: Check if jsonData is in fact json
	async insert(collectionName, jsonData)
	{
		await this.toEnqueue(collectionName, (collection) => {
			collection.push(jsonData);
			return jsonData;
		});
	}

	async clear(collectionName)
	{
		await this.toEnqueue(collectionName, (collection) => {
			// @NOTE: That tricky does not free the memory
			collection.length = 0;
		});
	}

	async find(collectionName, query = { })
	{
		return await this.toEnqueue(collectionName, (collection) => {
			if (Object.keys(query).length === 0)  {
				return collection;
			}

			return collection.filter(entry => 
				Object.entries(query).every(([key, value]) => {
					return entry[key] === value;
				})
			);
		});
	}
};

module.exports = DataBase;
