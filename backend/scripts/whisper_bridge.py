import sys
import json
import argparse
from faster_whisper import WhisperModel

def format_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    msecs = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{msecs:03d}"

def main():
    parser = argparse.ArgumentParser(description="Whisper Bridge for MediaFactory")
    parser.add_argument("audio_path", help="Path to the audio file")
    parser.add_argument("--model", default="base", help="Whisper model size (tiny, base, small, medium, large-v3)")
    parser.add_argument("--device", default="cpu", help="Device to use (cpu or cuda)")
    args = parser.parse_args()

    try:
        # Load Model
        # compute_type "int8" is safer for CPU/low-end GPU
        model = WhisperModel(args.model, device=args.device, compute_type="int8")

        # Transcribe
        segments, info = model.transcribe(args.audio_path, word_timestamps=True)

        srt_content = ""
        word_timestamps = []
        segment_id = 1

        for segment in segments:
            # Generate SRT block
            start_fmt = format_time(segment.start)
            end_fmt = format_time(segment.end)
            srt_content += f"{segment_id}\n{start_fmt} --> {end_fmt}\n{segment.text.strip()}\n\n"
            segment_id += 1

            # Extract word timestamps
            if segment.words:
                for word in segment.words:
                    word_timestamps.append({
                        "word": word.word.strip(),
                        "start": word.start,
                        "end": word.end,
                        "probability": word.probability
                    })

        output = {
            "success": True,
            "srtContent": srt_content.strip(),
            "wordTimestamps": word_timestamps,
            "detectedLanguage": info.language,
            "confidence": info.language_probability
        }
        
        print(json.dumps(output))

    except Exception as e:
        error_output = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_output))
        sys.exit(1)

if __name__ == "__main__":
    # Ensure stdout uses UTF-8 to prevent encoding issues with special characters in lyrics
    sys.stdout.reconfigure(encoding='utf-8')
    main()
