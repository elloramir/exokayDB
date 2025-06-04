const DataBase = require('./src/DataBase');

async function runTests() {
    const db = new DataBase();
    const collection = 'tests.json';

    const tests = [
        {
            name: 'Clear collection',
            fn: async () => {
                await db.clear(collection);
                const data = await db.find(collection);
                return Array.isArray(data) && data.length === 0;
            }
        },
        {
            name: 'Find on empty collection',
            fn: async () => {
                const data = await db.find(collection);
                return Array.isArray(data) && data.length === 0;
            }
        },
        {
            name: 'Insert user A',
            fn: async () => {
                await db.insert(collection, { id: 1, name: 'Alice', age: 25, city: 'CityA' });
                const data = await db.find(collection);
                return data.length === 1;
            }
        },
        {
            name: 'Insert user B',
            fn: async () => {
                await db.insert(collection, { id: 2, name: 'Bob', age: 30, city: 'CityB' });
                const data = await db.find(collection);
                return data.length === 2;
            }
        },
        {
            name: 'Find by existing city',
            fn: async () => {
                const data = await db.find(collection, { city: 'CityA' });
                return data.length === 1;
            }
        },
        {
            name: 'Insert duplicate ID',
            fn: async () => {
                const before = (await db.find(collection)).length;
                await db.insert(collection, { id: 1, name: 'AliceDuplicate', age: 25, city: 'CityA' });
                const after = (await db.find(collection)).length;
                return after === before + 1;
            }
        },
        {
            name: 'Insert invalid data (null)',
            fn: async () => {
                try {
                    await db.insert(collection, null);
                    return false;
                } catch {
                    return true;
                }
            }
        },
        {
            name: 'Find with nonexistent field',
            fn: async () => {
                const data = await db.find(collection, { nonexistent: 'value' });
                return Array.isArray(data) && data.length === 0;
            }
        },
        {
            name: 'Clear collection twice',
            fn: async () => {
                await db.clear(collection);
                await db.clear(collection);
                const data = await db.find(collection);
                return Array.isArray(data) && data.length === 0;
            }
        },
        {
            name: 'Insert 50 users',
            fn: async () => {
                for (let i = 1; i <= 50; i++) {
                    await db.insert(collection, {
                        id: i,
                        name: `User${i}`,
                        age: 20 + i,
                        city: `City${i}`
                    });
                }
                const data = await db.find(collection);
                return data.length === 50;
            }
        },
        {
            name: 'Concurrent insert and find',
            fn: async () => {
                const insertPromises = [];
                for (let i = 51; i <= 60; i++) {
                    insertPromises.push(
                        db.insert(collection, {
                            id: i,
                            name: `User${i}`,
                            age: 20 + i,
                            city: `City${i}`
                        })
                    );
                }
                // Start a find() at the same time as inserts
                const findPromise = db.find(collection);
                try {
                    const [data] = await Promise.all([findPromise, Promise.all(insertPromises)]);
                    return Array.isArray(data);
                } catch {
                    return false;
                }
            }
        }
    ];

    for (const [i, test] of tests.entries()) {
        try {
            const result = await test.fn();
            console.log(`Test ${i + 1}: ${test.name} - ${result ? 'PASSED' : 'FAILED'}`);
        } catch (err) {
            console.log(`Test ${i + 1}: ${test.name} - ERROR`);
        }
    }
}

async function testPersistence() {
    const db = new DataBase();
    const collection = 'tests.json';

    try {
        const data = await db.find(collection);
        const passed = Array.isArray(data) && data.length > 0;
        console.log(`Persistence Test - ${passed ? 'PASSED' : 'FAILED'}`);
    } catch (err) {
        console.log('Persistence Test - ERROR');
    }
}

async function main() {
    await runTests();
    await testPersistence();
}

if (require.main === module) {
    main().catch(console.error);
}
