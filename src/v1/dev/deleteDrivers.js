const { MongoClient } = require("mongodb");

// Connection URL
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

// Database and Collection Names
const dbName = "fast-go";
const collectionName = "users"; // 'users' collection

async function run() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log("Connected successfully to server");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Delete documents where role is 'driver'
    const deleteResult = await collection.deleteMany({ role: "driver" });
    console.log(
      `${deleteResult.deletedCount} documents with role 'driver' deleted successfully`
    );
  } finally {
    // Close the connection to the MongoDB server
    await client.close();
  }
}

run().catch(console.dir);
