import decode from "audio-decode";
import * as esPkg from "essentia.js";
import { readFile, readdir, rename } from "fs";

const essentia = new esPkg.Essentia(esPkg.EssentiaWASM);
const essentiaTfInputExtractor =
  new esPkg.EssentiaModel.EssentiaTFInputExtractor(esPkg.EssentiaWASM);

const folderPath = process.argv[2];

readdir(folderPath, (err, files) => {
  if (err) {
    console.log("Error reading directory: ", err);
    return;
  }

  files
    .filter((file) => !file.includes("bpm_"))
    .forEach(async (file) => {
      const audioFilePath = `${folderPath}/${file}`;
      console.log("audioFilePath: ", audioFilePath);
      readFile(audioFilePath, async (err, buffer) => {
        const audioBuffer = await convertToAudioBuffer(buffer);
        console.log(`${file}👇`);
        console.log("sample rate: ", audioBuffer.sampleRate);

        // const audioMono =
        //   essentiaTfInputExtractor.audioBufferToMonoSignal(audioBuffer);
        // const audioVector = essentiaTfInputExtractor.arrayToVector(audioMono);

        const audioMono = essentia.audioBufferToMonoSignal(audioBuffer);
        const audioVector = essentia.arrayToVector(audioMono);

        // https://essentia.upf.edu/reference/std_RhythmExtractor2013.html
        const computed = essentia.PercivalBpmEstimator(
          audioVector,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          audioBuffer.sampleRate
        );

        console.log("bpm: ", Math.round(computed.bpm));

        rename(
          audioFilePath,
          `${folderPath}/bpm_${Math.round(computed.bpm)}_${file}`,
          (err) => {
            if (err) {
              console.log("Error renaming file: ", err);
              return;
            }
          }
        );
        console.log(`✅ ${folderPath}/bpm_${Math.round(computed.bpm)}_${file}`);
        console.log("-----------------------------");
      });
    });
});

async function convertToAudioBuffer(buffer: Buffer) {
  const audioBuffer = await decode(buffer);
  return audioBuffer;
}
