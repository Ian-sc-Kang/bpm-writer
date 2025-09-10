# BPM Writer

> Automatic BPM detection and file renaming tool for audio files

A Node.js command-line tool that automatically detects the BPM (Beats Per Minute) of audio files and renames them with their detected tempo. Built with TypeScript and powered by [Essentia.js](https://github.com/MTG/essentia.js) for accurate audio analysis.

## ✨ Features

- 🎵 **Automatic BPM Detection** - Uses Essentia.js PercivalBpmEstimator algorithm
- 📁 **Batch Processing** - Process entire directories at once
- 🔄 **Smart File Renaming** - Adds `bpm_XXX_` prefix to filenames
- 🎧 **Multiple Format Support** - MP3, WAV, FLAC, OGG, Opus, QOA
- ⚡ **Optimized Processing** - Downsamples audio to 16kHz for faster analysis
- 🛡️ **Error Handling** - Robust error handling with detailed logging
- 🔍 **Skip Processed Files** - Automatically skips files already containing `bpm_` prefix

## 🚀 Installation

**Prerequisites:** Node.js 16.x or higher

```bash
# Clone the repository
git clone https://github.com/your-username/bpm-writer.git
cd bpm-writer

# Install dependencies
npm install
```

## 📖 Usage

```bash
# Process all audio files in a directory
npm start /path/to/your/audio/files

# Example
npm start ./my-music-collection
```

### Example Output

```
🔍 Scanning directory: ./my-music-collection
📁 Found 15 files total
🎵 Found 12 audio files to process

🎵 Processing: awesome-song.mp3
   📊 Sample rate: 44100 Hz
   📊 Duration: 7526400 samples
   🔄 Downsampling from 44100 Hz to 16000 Hz...
   🎯 Detected BPM: 128
   ✅ Renamed to: bpm_128_awesome-song.mp3

🎵 Processing: another-track.wav
   📊 Sample rate: 48000 Hz
   📊 Duration: 9216000 samples
   🔄 Downsampling from 48000 Hz to 16000 Hz...
   🎯 Detected BPM: 140
   ✅ Renamed to: bpm_140_another-track.wav
```

**File Naming:** `my-song.mp3` → `bpm_128_my-song.mp3`

*Files with existing `bpm_` prefixes are automatically skipped.*

## 🔧 How It Works

1. **File Discovery** - Scans directory for supported audio formats
2. **Audio Decoding** - Uses `audio-decode` to read audio files
3. **Signal Processing** - Converts to mono and downsamples to 16kHz
4. **BPM Detection** - Applies Essentia.js PercivalBpmEstimator
5. **File Renaming** - Adds BPM prefix to filename

## 🛠️ Development

```bash
# Build TypeScript
npm run build

# Run with auto-reload
npm run dev
```

## 🧪 Testing

```bash
# Create test directory with sample audio files
mkdir test-audio
# Add audio files to test-audio/
# Run the tool
npm start test-audio
```

**Verify:**
- Files are renamed with BPM prefixes
- BPM values are reasonable for the music genre
- No files are corrupted or missing

## 📊 Technical Details

**Algorithm:** Essentia.js PercivalBpmEstimator
- Analyzes rhythmic patterns in audio spectrum
- Uses onset detection for beat identification  
- Typically accurate within ±2 BPM

**Optimizations:**
- Downsamples to 16kHz for faster processing
- Converts stereo to mono
- Sequential processing for memory management

## 🔍 Troubleshooting

**No audio files found:**
- Check directory contains supported formats (.mp3, .wav, .flac, .ogg, .opus, .qoa)
- Verify file extensions are correct

**Decode errors:**
- File may be corrupted or unsupported
- Try converting to standard format (MP3/WAV)

**Memory issues:**
- Tool processes files sequentially
- Ensure sufficient RAM for large files (>100MB)

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Essentia.js](https://github.com/MTG/essentia.js) - Audio analysis library
- [audio-decode](https://github.com/audiojs/audio-decode) - Audio file decoding
- Music Technology Group (MTG) - Essentia audio analysis framework

---

> **Note:** This tool provides BPM estimates based on algorithmic analysis. While generally accurate, results should be verified for critical applications.
