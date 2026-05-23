const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());

app.get("/", (req, res) => {
  res.json({
    message: "API RUNNING",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`SERVER RUNNING ON ${PORT}`);
});