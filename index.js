import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

import { MongoClient, ObjectId } from "mongodb";

// Initialize the express app
const app = express();
dotenv.config();

const serverPort = process.env.SERVER_PORT || 5000;
const mongoUrl = process.env.MONGO_URL;
const allowedUrls = process.env.ALLOWED_URLS.split(",");

// Middlewares
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedUrls.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Personal MiddleWares
const logger = async (req, res, next) => {
  console.log("Called:", req.host, req.originalUrl);
  next();
};

const verifyToken = async (req, res, next) => {
  const receivedToken = req.cookies.token;
  if (!receivedToken) {
    return res.status(401).send({ message: "Unauthorised" });
  }
  jwt.verify(receivedToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log(err.message);
      return res.status(401).send({ message: "Unauthorised" });
    }
    req.user = decoded;

    next();
  });
};

//Create a MongoClient instances

const client = new MongoClient(mongoUrl);

async function run() {
  try {
    // Services collection
    const serviceCollections = client.db("Car-Doctor").collection("services");

    // Services collection
    const checkOutCollection = client.db("Car-Doctor").collection("checkOuts");

    // Auth Related APIS
    app.post("/api/jwt", async (req, res) => {
      try {
        const token = jwt.sign(req.body, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });
        res
          .cookie("token", token, {
            httpOnly: true,
            secure: false, // for development https, then "true"
            sameSite: "strict",
            // secure: process.env.NODE_ENV === "production" ? true : false,
            // sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          })
          .send({ success: true });
      } catch (err) {
        console.error(err.message);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    app.post("/api/logout", (req, res) => {
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    // Services Relative API
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

    app.get("/api/checkouts/:uid", logger, verifyToken, async (req, res) => {
      if (req.params.uid !== req.user.uid) {
        return res.status(403).send({ message: "Forbidden" });
      }
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
