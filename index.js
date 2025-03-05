const fs = require("fs");
const readline = require("readline");
const path = require("path");

const INPUT_FILE = "./hugefile.txt";

//определяем размер чанка байты=-кб=-мб. для теста ограничился значением в 350кб, потом для финального решения
//нужно раскоментить умножение до мегабайтов
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

// слияние чанков в один файл
async function mergeFiles() {
  let files = fs.readdirSync(TEMP_DIR).map((file) => path.join(TEMP_DIR, file));
  let streams = files.map((file) =>
    readline.createInterface({
      input: fs.createReadStream(file, { encoding: "utf-8" }),
    })
  );

  //запускаем все стримы по очереди и ждем их завершения
  let lines = await Promise.all(
    streams.map(async (s) => {
      let result = await s.next();
      return result;
    })
  );

  let outputStream = fs.createWriteStream(OUTPUT_FILE);

  // используем цикл, чтобы пройти по всем строкам и слить их в правильном порядке
  for (let continueProcessing = true; continueProcessing; ) {
    let minIndex = -1;
    let minValue = null;

    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].done) {
        if (minValue === null || lines[i].value.localeCompare(minValue) < 0) {
          minValue = lines[i].value;
          minIndex = i;
        }
      }
    }

    // ели все потоки завершены прекращаем обработку
    if (minIndex === -1) {
      continueProcessing = false;
    } else {
      outputStream.write(lines[minIndex].value + "\n");

      // обновляем строку из потока с минимальным значением
      lines[minIndex] = await streams[minIndex][Symbol.asyncIterator]().next();
    }
  }

  // завершаем запись в outputStream
  outputStream.end();
}

// основной процесс
async function processFiles() {
  console.log("начало");
  await splitFile();
  console.log("разделение завершено!");
  await mergeFiles();
  console.log("Файл отсортирован и сохранен в " + OUTPUT_FILE);
}

processFiles();
