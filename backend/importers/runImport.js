require("dotenv").config();

const mongoose = require("mongoose");

const { runECImport } = require("./ghana/ecImporter");

async function start() {

  await mongoose.connect(process.env.MONGO_URI);

  const result = await runECImport();

  console.log(result);

  process.exit();

}

start();
