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
    const serviceCollections = client.db("Car-Doctor").collection("services");

    // Services collection
    const checkOutCollection = client.db("Car-Doctor").collection("checkOuts");

    // Get all Services from db
    app.get("/api/services", async (req, res) => {
      try {
        const result = await serviceCollections.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching Services:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // Get checkouts from db based on the uid

    app.get("/api/checkouts/:uid", async (req, res) => {
      try {
        const result = await checkOutCollection
          .find({ uid: req.params.uid })
          .toArray();
        res.status(200).send(result);
      } catch (error) {
        console.error("Error fetching check outs:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // Save Checkout to db
    app.post("/api/checkout", async (req, res) => {
      try {
        const result = await checkOutCollection.insertOne(req.body);
        console.log(result);
        res.status(201).send({ message: "Checkout list saved successfully" });
      } catch (error) {
        console.error("Error saving checkouts:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // Get specific service from db based on the id
    app.get("/api/service/:id", async (req, res) => {
      try {
        const result = await serviceCollections.findOne(
          {
            _id: new ObjectId(req.params.id),
          },
          {
            projection: { title: 1, price: 1 },
          }
        );
        if (result) {
          res.send(result);
        } else {
          res.status(404).send({ message: "Services not found" });
        }
      } catch (error) {
        console.error("Error fetching Services:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    //  end of all APIs
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
