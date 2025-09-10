import decode from "audio-decode";
import * as esPkg from "essentia.js";
import { readFile, readdir, rename } from "fs";

const essentia = new esPkg.Essentia(esPkg.EssentiaWASM);

const folderPath = process.argv[2];

if (!folderPath) {
  console.error('❌ Please provide a directory path as an argument');
  console.log('Usage: npm start /path/to/your/audio/files');
  process.exit(1);
}

console.log(`🔍 Scanning directory: ${folderPath}`);

readdir(folderPath, (err, files) => {
  if (err) {
    console.error(`❌ Error reading directory: ${err.message}`);
    return;
  }

  console.log(`📁 Found ${files.length} files total`);

  const audioFiles = files
    //NOTE: Supported formats: https://github.com/audiojs/audio-decode
    .filter(
      (file) =>
        file.endsWith(".mp3") ||
        file.endsWith(".wav") ||
        file.endsWith(".flac") ||
        file.endsWith(".ogg") ||
        file.endsWith(".opus") ||
        file.endsWith(".qoa"),
    )
    .filter((file) => !file.includes("bpm_"));

  console.log(`🎵 Found ${audioFiles.length} audio files to process`);

  if (audioFiles.length === 0) {
    console.log("No audio files to analyze BPM found in the directory");
    return;
  }

  audioFiles.forEach(async (file) => {
    const audioFilePath = `${folderPath}/${file}`;
    readFile(audioFilePath, async (err, buffer) => {
      if (err) {
        console.error(`❌ Error reading file ${file}:`, err.message);
        return;
      }
      
      try {
        const audioBuffer = await convertToAudioBuffer(buffer);
        console.log(`\n🎵 Processing: ${file}`);
        console.log(`   📊 Sample rate: ${audioBuffer.sampleRate} Hz`);
        console.log(`   📊 Duration: ${audioBuffer.getChannelData(0).length} samples`);

        const audioMono = essentia.audioBufferToMonoSignal(audioBuffer);
        const Down_Sample_RATE = 16000;
        console.log(`   🔄 Downsampling from ${audioBuffer.sampleRate} Hz to ${Down_Sample_RATE} Hz...`);
        
        const downsampledArray = downsampleArray(
          audioMono,
          audioBuffer.sampleRate,
          Down_Sample_RATE,
        );
        const vectorFloat = essentia.arrayToVector(downsampledArray);

        const bpm = detectBPM(vectorFloat, Down_Sample_RATE);
        console.log(`   🎯 Detected BPM: ${Math.round(bpm)}`);

        const newFileName = `bpm_${Math.round(bpm)}_${file}`;
        rename(
          audioFilePath,
          `${folderPath}/${newFileName}`,
          (err) => {
            if (err) {
              console.error(`   ❌ Error renaming file: ${err.message}`);
              return;
            }
            console.log(`   ✅ Renamed to: ${newFileName}`);
          },
        );

        vectorFloat.delete();
      } catch (error) {
        console.error(`   ❌ Error processing ${file}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    });
  });
});

/**
 * Converts a raw audio buffer to an AudioBuffer object using audio-decode
 * @param buffer - The raw audio buffer from file system
 * @returns Promise resolving to an AudioBuffer
 */
async function convertToAudioBuffer(buffer: Buffer): Promise<AudioBuffer> {
  try {
    const audioBuffer = await decode(new Uint8Array(buffer));
    return audioBuffer;
  } catch (error) {
    throw new Error(`Failed to decode audio buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Detects BPM using Essentia's PercivalBpmEstimator algorithm
 * @param vectorFloat - The audio signal vector from Essentia
 * @param sampleRate - The sample rate of the audio signal
 * @returns The detected BPM rounded to the nearest integer
 */
function detectBPM(vectorFloat: any, sampleRate: number): number {
  const computed = essentia.PercivalBpmEstimator(
    vectorFloat,
    undefined, // frameSize (default)
    undefined, // hopSize (default) 
    undefined, // maxBPM (default)
    undefined, // minBPM (default)
    undefined, // stepBPM (default)
    undefined, // windowType (default)
    sampleRate,
  );
  return Math.round(computed.bpm);
}

function detectDanceability(vectorFloat: any, sampleRate: number) {
  const computed = essentia.Danceability(
    vectorFloat,
    undefined,
    undefined,
    sampleRate,
    undefined,
  );
  return Math.round(computed.danceability * 10) / 10;
}

/**
 * Downsamples an audio array from one sample rate to another using simple averaging
 * @param audioIn - Input audio array
 * @param sampleRateIn - Original sample rate in Hz
 * @param sampleRateOut - Target sample rate in Hz  
 * @returns Downsampled audio array
 */
function downsampleArray(
  audioIn: Float32Array,
  sampleRateIn: number,
  sampleRateOut: number,
): Float32Array {
  if (sampleRateOut === sampleRateIn) {
    return audioIn;
  }
  
  const sampleRateRatio = sampleRateIn / sampleRateOut;
  const newLength = Math.round(audioIn.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetAudioIn = 0;

  while (offsetResult < result.length) {
    const nextOffsetAudioIn = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    
    for (let i = offsetAudioIn; i < nextOffsetAudioIn && i < audioIn.length; i++) {
      accum += audioIn[i];
      count++;
    }
    
    result[offsetResult] = accum / count;
    offsetResult++;
    offsetAudioIn = nextOffsetAudioIn;
  }

  return result;
}
