import { Db, Filter, FindOptions, MongoClient, UpdateFilter } from "mongodb";

interface ConnectionConfig {
	url: string;
	dbName: string;
}

const isObject = (obj: any): boolean => {
	return obj && typeof obj === "object" && Object.keys(obj).length > 0;
};

export class MongoDbClient {
	private db!: Db;
	private client!: MongoClient;

	async connect(conn: ConnectionConfig, onSuccess: () => void | unknown | any, onFailure: (error: any) => void): Promise<void> {
		try {
			const client = new MongoClient(conn.url, {});
			await client.connect();
			this.db = client.db(conn.dbName);
			console.info("MongoClient Connection successful");
			onSuccess();
		} catch (ex) {
			console.error("Error caught: ", ex);
			onFailure(ex);
		}
	}

	async FindDocFieldsByFilter(coll: string, query: object, projection?: object, lmt: number = 0): Promise<any> {
		if (!isObject(query)) {
			throw new Error("MongoDbClient.findDocFieldsByFilter: query is not an object");
		}
		return this.db
			.collection(coll)
			.find(query, { projection } as FindOptions)
			.limit(lmt)
			.toArray();
	}
	async FindDocAggregation(coll: string, query: object[]): Promise<any> {
		if (!Array.isArray(query) || query.length === 0) {
			throw new Error("MongoDbClient.FindDocByAggregation: query is not an array");
		}
		return this.db.collection(coll).aggregate(query).toArray();
	}
	async FindOneAndUpdate(coll: string, query: object, values: object, options: object = {}): Promise<any> {
		if (!isObject(values) && !isObject(query)) {
			throw new Error("MongoDbClient.FindOneAndUpdate: values and query should be object");
		}
		return this.db.collection(coll).findOneAndUpdate(query, { $set: values }, options);
	}

	async getDocumentCountQuery(coll: string, query: object = {}): Promise<number> {
		return this.db.collection(coll).countDocuments(query);
	}

	async GetNextSequence(coll: Filter<Document | any> | string): Promise<any> {
		return this.db.collection("counters").findOneAndUpdate({ _id: coll as Filter<Document | any> }, { $inc: { seq: 1 } }, { projection: { seq: 1 }, upsert: true, returnDocument: "after" });
	}
	async InsertDocumentWithIndex(coll: string, doc: Record<string, any>): Promise<any> {
		if (!isObject(doc)) {
			throw new Error("MongoDbClient.InsertDocumentWithIndex: Document is not an object");
		}
		const index = await this.GetNextSequence(coll);
		doc.idx = index.value?.seq;
		return this.db.collection(coll).insertOne(doc);
	}

	async ModifyOneDocument(coll: string, values: UpdateFilter<any>, query: object, option: object = {}) {
		if (!isObject(values) && !isObject(query)) {
			throw new Error("MongoDbClient.ModifyOneDocument: values and query should be object");
		}
		return this.db.collection(coll).updateOne(query,values,option)
	}

	async close(force?: boolean): Promise<any> {
		this.client.close(force);
		// @ts-ignore
		this.db?.close();
		return;
	}
}
