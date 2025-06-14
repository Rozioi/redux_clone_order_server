import { error } from "console";
import { realpath } from "fs/promises";
import { ClientSession, Db, Filter, FindOptions, MongoClient, UpdateFilter } from "mongodb";

interface ConnectionConfig {
	url: string;
	dbName: string;
}

const isObject = (obj: any): boolean => {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
};

export class MongoDbClient {
	private db!: Db;
	private client!: MongoClient;

	constructor(config: ConnectionConfig) {
		this.client = new MongoClient(config.url);
		this.db = this.client.db(config.dbName);
	}

	async connect(onSuccess: () => void | unknown | any, onFailure: (error: any) => void): Promise<void> {
		try {
			await this.client.connect();
			this.db = this.client.db(this.db.databaseName);
			console.info("Connected to MongoDB");

			// Создаем индексы для оптимизации поиска
			await this.createIndexes();

			onSuccess();
		} catch (ex) {
			console.error("MongoDB connection error:", ex);
			onFailure(ex);
		}
	}

	private async createIndexes() {
		try {
			// Индекс для платежей
			await this.db.collection('payments').createIndexes([
				{ key: { paymentId: 1 }, unique: true },
				{ key: { userId: 1 } },
				{ key: { status: 1 } }
			]);

			// Индекс для подписок пользователей
			await this.db.collection('user_subscriptions').createIndexes([
				{ key: { userId: 1 }, unique: true },
				{ key: { isActive: 1 } }
			]);

			console.log("MongoDB indexes created successfully");
		} catch (ex) {
			console.error("Error creating indexes:", ex);
			throw ex;
		}
	}

	async FindDocFieldsByFilter(coll: string, query: object, projection?: object, lmt: number = 0, skip: number = 0): Promise<any> {
		if (!isObject(query)) {
			throw new Error("MongoDbClient.findDocFieldsByFilter: query is not an object");
		}
		return this.db
			.collection(coll)
			.find(query, { projection } as FindOptions)
			.skip(skip)
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

	async GetNextSequence(coll: Filter<Document | any> | string, session?: ClientSession): Promise<any> {
		return this.db.collection("counters").findOneAndUpdate(
			{ _id: coll as Filter<Document | any> },
			{ $inc: { seq: 1 } },
			{ projection: { seq: 1 }, upsert: true, returnDocument: "after", session }
		);
	}

	async InsertDocumentWithIndex(coll: string, doc: Record<string, any>, session?: ClientSession): Promise<any> {
		if (!isObject(doc)) {
			throw new Error("MongoDbClient.InsertDocumentWithIndex: Document is not an object");
		}
		const index = await this.GetNextSequence(coll, session);
		doc.idx = index.seq;
		return this.db.collection(coll).insertOne(doc, { session });
	}

	async startSession(): Promise<ClientSession> {
		if (!this.client) {
			throw new Error("MongoDB client is not connected");
		}
		return this.client.startSession();
	}

	async DeleteDocument(coll: string, query: object): Promise<any> {
		if (!isObject(query)) {
			throw new Error("MongoDbClient.DeleteDocument: query is not an object");
		}
		return this.db.collection(coll).deleteOne(query);
	}

	async DeleteManyDocument(coll: string, query: object): Promise<any> {
		if (!isObject(query)) {
			throw new Error("MongoDbClient.DeleteDocument: query is not an object");
		}
		return this.db.collection(coll).deleteMany(query);
	}

	async ModifyOneDocument(coll: string, values: UpdateFilter<any>, query: object, option: object = {}) {
		if (!isObject(values) && !isObject(query)) {
			throw new Error("MongoDbClient.ModifyOneDocument: values and query should be object");
		}
		return this.db.collection(coll).updateOne(query, values, option);
	}

	async close(force?: boolean): Promise<void> {
		if (this.client) {
			await this.client.close(force);
		}
		return;
	}
}
