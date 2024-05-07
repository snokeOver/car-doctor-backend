import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { MongoClient, ObjectId } from "mongodb";

// Initialize the express app
const app = express();
dotenv.config();

const serverPort = process.env.SERVER_PORT || 5000;
const mongoUrl = process.env.MONGO_URL;

// Middlewares
app.use(cors());
app.use(express.json());

//Create a MongoClient instances

const client = new MongoClient(mongoUrl);

async function run() {
  try {
    // Services collection
    const serviceCollections = client.db("car-doctor").collection("services");
  } catch (err) {
    console.log(err.message);
  }
}

run().catch(console.error);

app.get("/", (req, res) => {
  res.send("Hello from Car Doctor");
});

app.listen(serverPort, () => {
  console.log(`Car Doctor is running on ${serverPort}`);
});
