import decode from "audio-decode";
import * as esPkg from "essentia.js";
import { readFile, readdir, rename } from "fs";

const essentia = new esPkg.Essentia(esPkg.EssentiaWASM);

const folderPath = process.argv[2];

readdir(folderPath, (err, files) => {
  if (err) {
    console.log("Error reading directory: ", err);
    return;
  }

  const audioFiles = files
    //NOTE: Supported formats: https://github.com/audiojs/audio-decode
    //NOTE: also exclude hidden files (e.g. .DS_Store)
    .filter(
      (file) =>
        file.endsWith(".mp3") ||
        file.endsWith(".wav") ||
        file.endsWith(".flac") ||
        file.endsWith(".ogg") ||
        file.endsWith(".opus") ||
        file.endsWith(".qoa")
    )
    .filter((file) => !file.includes("bpm_"));

  if (audioFiles.length === 0) {
    console.log("No audio files to analyze BPM found in the directory");
    return;
  }

  audioFiles.forEach(async (file) => {
    const audioFilePath = `${folderPath}/${file}`;
    readFile(audioFilePath, async (err, buffer) => {
      const audioBuffer = await convertToAudioBuffer(buffer);
      console.log(`filename: ${file}👇`);
      console.log("sample rate: ", audioBuffer.sampleRate);
      console.log("length: ", audioBuffer.getChannelData(0).length);

      const audioMono = essentia.audioBufferToMonoSignal(audioBuffer);
      const Down_Sample_RATE = 16000;
      const downsampledArray = downsampleArray(
        audioMono,
        audioBuffer.sampleRate,
        Down_Sample_RATE
      );
      const vectorFloat = essentia.arrayToVector(downsampledArray);

      const bpm = detectBPM(vectorFloat, Down_Sample_RATE);
      // const danceability = detectDanceability(
      //   vectorFloat,
      //   Down_Sample_RATE
      // );

      rename(
        audioFilePath,
        `${folderPath}/bpm_${Math.round(bpm)}_${file}`,
        (err) => {
          if (err) {
            console.log("Error renaming file: ", err);
            return;
          }
        }
      );
      console.log("✅ bpm: ", bpm);
      // console.log("✅ danceability: ", danceability);
      console.log("-----------------------------");

      vectorFloat.delete();
    });
  });
});

async function convertToAudioBuffer(buffer: Buffer) {
  const audioBuffer = await decode(buffer);
  return audioBuffer;
}

function detectBPM(vectorFloat: any, sampleRate: number) {
  const computed = essentia.PercivalBpmEstimator(
    vectorFloat,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    sampleRate
  );
  // non-JS object needs to be explicitly removed from memory
  return Math.round(computed.bpm);
}

function detectDanceability(vectorFloat: any, sampleRate: number) {
  const computed = essentia.Danceability(
    vectorFloat,
    undefined,
    undefined,
    sampleRate,
    undefined
  );
  return Math.round(computed.danceability * 10) / 10;
}

function downsampleArray(
  audioIn: Float32Array,
  sampleRateIn: number,
  sampleRateOut: number
) {
  if (sampleRateOut === sampleRateIn) {
    return audioIn;
  }
  let sampleRateRatio = sampleRateIn / sampleRateOut;
  let newLength = Math.round(audioIn.length / sampleRateRatio);
  let result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetAudioIn = 0;

  console.log(`Downsampling to ${sampleRateOut} kHz...`);
  while (offsetResult < result.length) {
    let nextOffsetAudioIn = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0,
      count = 0;
    for (
      let i = offsetAudioIn;
      i < nextOffsetAudioIn && i < audioIn.length;
      i++
    ) {
      accum += audioIn[i];
      count++;
    }
    result[offsetResult] = accum / count;
    offsetResult++;
    offsetAudioIn = nextOffsetAudioIn;
  }

  return result;
}
