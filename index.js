const fs = require("fs");
const readline = require("readline");

const filePath = "./hugefile.txt";

const readStream = fs.createReadStream(filePath, { encoding: "utf8" });
const rl = readline.createInterface({
  input: readStream,
  crlfDelay: Infinity,
});

rl.on("line", (line) => {
  console.log(line);
});

rl.on("close", () => {
  console.log("listening");
});

readStream.on("error", (err) => {
  console.error("error", err);
});
