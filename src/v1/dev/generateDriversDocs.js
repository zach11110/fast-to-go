const { MongoClient, ObjectId } = require("mongodb");

// Connection URL
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

// Database and Collection Names
const dbName = "fast-go";
const collectionName = "users"; // Insert into 'users' collection

// Function to generate a random phone number
function generateRandomPhoneNumber() {
  const icc = "+218"; // International Country Code
  const nsn = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, "0"); // National Significant Number
  return {
    full: `${icc}${nsn}`,
    icc: icc,
    nsn: nsn,
  };
}

// Function to generate a random location within a specified range
function generateRandomLocation() {
  const minLat = -90;
  const maxLat = 90;
  const minLon = -180;
  const maxLon = 180;
  const latitude = parseFloat(
    (Math.random() * (maxLat - minLat) + minLat).toFixed(6)
  );
  const longitude = parseFloat(
    (Math.random() * (maxLon - minLon) + minLon).toFixed(6)
  );
  return {
    longitude,
    latitude,
  };
}

// Sample document template
const templateDocument = {
  avatarURL:
    "https://storage.googleapis.com/download/storage/v1/b/fast-go-bucket/o/5323a25b-d1c1-4ba0-b965-ebc9ffc92837.jpg?generation=1718991946301661&alt=media",
  firstName: "test",
  lastName: "driver",
  location: {},
  email: "testdriver@test.com",
  phone: {
    full: "+218346231666",
    icc: "+218",
    nsn: "346231666",
  },
  role: "driver",
  gender: "male",
  display: {
    language: "ar",
  },
  verified: {
    email: false,
    phone: true,
    driver: true,
  },
  carId: new ObjectId("6675bc4fced1295d2a968674"),
  notifications: {
    active: true,
    list: [],
  },
  balance: 0,
  driverEvalution: {
    text: [],
    rate: 1,
  },
  driverStatus: {
    active: true,
    busy: false,
    profitRate: 0.15,
    rejected: false,
  },
  referral: {
    number: 0,
    code: "828c060fbdb955",
  },
  trips: {
    asPassenger: 0,
    asDriver: 0,
  },
  deviceToken: "123456",
  lastLogin: new Date(),
  deleted: false,
  blocked: false,
  verification: {
    email: {
      code: "",
      expiryDate: new Date(),
    },
    phone: {
      code: "",
      expiryDate: null,
    },
    deletion: {
      code: "",
      expiryDate: new Date(),
    },
  },
  savedPlaces: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  __v: 2,
};

async function run() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log("Connected successfully to server");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Generate 100 documents
    const documents = [];
    const usedPhoneNumbers = new Set();

    for (let i = 0; i < 5; i++) {
      const newDocument = { ...templateDocument };
      newDocument._id = new ObjectId(); // Unique ObjectId for each document
      newDocument.firstName = `test${i + 1}`;
      newDocument.lastName = `driver${i + 1}`;
      newDocument.email = `testdriver${i + 1}@test.com`;

      // Ensure unique phone number
      let phone;
      do {
        phone = generateRandomPhoneNumber();
      } while (usedPhoneNumbers.has(phone.full));
      usedPhoneNumbers.add(phone.full);

      newDocument.phone = phone;

      // Generate random location
      newDocument.location = generateRandomLocation();

      newDocument.lastLogin = new Date();
      newDocument.createdAt = new Date();
      newDocument.updatedAt = new Date();
      documents.push(newDocument);
    }

    // Insert documents into the 'users' collection
    const result = await collection.insertMany(documents);
    console.log(`${result.insertedCount} documents inserted successfully`);
  } finally {
    // Close the connection to the MongoDB server
    await client.close();
  }
}

run().catch(console.dir);
