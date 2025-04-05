// lib/mongo.ts
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// 正確的全局變量型別擴展
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!process.env.MONGODB_URI) {
  throw new Error("請在 .env 設定 MONGODB_URI");
}

if (process.env.NODE_ENV === "development") {
  // 在開發環境中，使用全局變量來避免連接熱重載時建立多個連接
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // 在生產環境中，為每個實例創建新的連接
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
