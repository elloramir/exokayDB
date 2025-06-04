const fs = require("fs");
const path = require("path");
const readline = require("readline");
const asyncFS = fs.promises;

class Collection {
	constructor(name, dir = ".") {
		this.name = name;
		this.filePath = path.join(dir, `${name}.ndjson`);
	}

	// Append a new JSON record as a single line
	async append(data) {
		const line = JSON.stringify(data) + "\n";
		await asyncFS.appendFile(this.filePath, line);
		return data;
	}

	// Generator that yields one parsed object per line
	async *readLines() {
		try {
			await asyncFS.access(this.filePath);
		} catch {
			return;
		}

		const input = fs.createReadStream(this.filePath, { encoding: "utf8" });
		const rl = readline.createInterface({ input, crlfDelay: Infinity });

		for await (const raw of rl) {
			const line = raw.trim();
			if (!line) continue;
			try {
				yield JSON.parse(line);
			} catch {
				// skip invalid JSON lines
			}
		}
	}

	async clear() {
		// Truncate the file (clear all records)
		await asyncFS.writeFile(this.filePath, "");
	}
}

module.exports = Collection;
