const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const http = require("http");

const cors = require("cors");
const userRoute = require("./routes/auth");
const jobsRoute = require("./routes/job");

const bodyParser = require("body-parser");
const app = express();
const httpServer = http.createServer(app);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());

app.use("/user", userRoute);
app.use("/job", jobsRoute);

app.use((error, request, response, next) => {
  const status = error.statusCode;
  const message = error.message;

  response.status(200).json({ message: message });
});
mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.y1iwedf.mongodb.net/${process.env.MONGO_DATABASE}`
  )
  .then((result) => {
    console.log("Connected")
    httpServer.listen(3004, "localhost");
  })
  .catch((error) => {
    console.log("error :=> ", error);
    console.log("Not Connected");
  });
