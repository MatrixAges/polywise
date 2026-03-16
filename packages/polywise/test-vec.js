import Database from 'better-sqlite3'
import * as sqliteVec from 'sqlite-vec'

const db = new Database(':memory:')
sqliteVec.load(db)
db.exec('CREATE VIRTUAL TABLE vec USING vec0(vector float[3])')
const stmt = db.prepare('INSERT INTO vec(rowid, vector) VALUES (?, ?)')
const vector = new Float32Array([1, 2, 3])

try {
	stmt.run(1, Buffer.from(vector.buffer))
	console.log('Success with Number')
} catch (e) {
	console.log('Error with Number:', e.message)
}

try {
	stmt.run(BigInt(1), Buffer.from(vector.buffer))
	console.log('Success with BigInt')
} catch (e) {
	console.log('Error with BigInt:', e.message)
}
