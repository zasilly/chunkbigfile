const fs = require("fs");
const readline = require("readline");
const path = require("path");

const INPUT_FILE = "./hugefile.txt";

//определяем размер чанка байты=-кб=-мб. для теста ограничился значением в 350кб, потом для финального решения
// нужно раскоментить умножение до мегабайтов
const CHUNK_SIZE = 350 * 1024; //* 1024;

//папка для временных файлов
const TEMP_DIR = "temp_chunks";

//файл для записи отсортированных данных
const OUTPUT_FILE = "sorted_output.txt";

// создаем папку
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// удаляем все файлы в папке (чтобы не лезть вручную во время теста)
try {
  fs.readdirSync(TEMP_DIR).forEach((file) =>
    fs.unlinkSync(path.join(TEMP_DIR, file))
  );
  fs.unlinkSync(path.join(OUTPUT_FILE));
  console.log('удалены все файлы в папке "temp_chunks" и "sorted_output.txt"');
} catch (e) {
  console.log(e);
}
// функция разделения файла на чанки
async function splitFile() {
  let fileStream = fs.createReadStream(INPUT_FILE, { encoding: "utf-8" });
  let rl = readline.createInterface({ input: fileStream });
  let chunk = [];
  let chunkIndex = 0;
  let currentSize = 0;

  let lines = [];
  for await (let line of rl) {
    lines.push(line);
  }

  // обрабатываем строки
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    chunk.push(line);
    currentSize += Buffer.byteLength(line, "utf-8");

    if (currentSize >= CHUNK_SIZE) {
      await writeChunk(chunk, chunkIndex);
      chunk = [];
      currentSize = 0;
      chunkIndex++;
    }
  }
}
//пишем чанки
async function writeChunk(chunk, index) {
  let filePath = path.join(TEMP_DIR, `chunk_${index}.txt`);
  await fs.promises.writeFile(filePath, chunk.join("\n"));
}

// основной процесс
(async () => {
  console.log("разделение файла на чанки...");
  await splitFile();
  console.log("разделение завершено!");

  console.log("слияние файлов...");
  await mergeFiles();
  console.log(`файл отсортирован и сохранён в ${OUTPUT_FILE}`);
})();
