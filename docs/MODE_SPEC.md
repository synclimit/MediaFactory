# Mode Specification: MediaFactory

## Mode 1: Single Source Video Multi-Output Creator

### Purpose
Create multiple output videos from a single source video file by pairing it with different audio tracks and looping the video to match the audio duration.

### Input Assets
- A single source video file.
- Multiple local audio track files.
- A configuration profile (required).

### Output Assets
- Multiple output video files matching the audio durations.
- Default Quality: 240p (360p optional).

### Workflow
1. User selects a processing profile.
2. User uploads the single source video.
3. System calculates the available video loop slots.
4. User assigns audio tracks to slots.
5. System loops the source video to match the audio track duration.
6. System renders the files using FFmpeg.
7. System runs validation on the rendered outputs.
8. System executes the AutoUploader to publish the videos.

### Validation Rules
- Verify source video file exists and is readable.
- Verify assigned audio files exist and are not corrupted.
- Output video format and resolution must strictly match selected profile settings (240p or 360p).
- Target output folder must have sufficient space.

### Queue Behaviour
- Each generated slot mapping is queued as an individual job.
- Jobs run sequentially in the Queue Engine.

### Retry Behaviour
- Automatic retry is supported (up to 2 times).

### Integration Rules
- Profile required.
- AutoUploader enabled post-render validation.
- Validation mandatory before upload.

---

## Mode 2: Randomized Audio Playlist Generator

### Purpose
Generate multiple randomized audio compilation outputs from a batch of uploaded audio files.

### Input Assets
- Multiple local audio files.
- (No profile used).

### Output Assets
- Multiple MP3 file compilations.
- Target Duration: Approximately 15 minutes per compilation.

### Workflow
1. User uploads a batch of audio files.
2. System generates a randomized playlist order.
3. System processes and compiles the audio files into multiple MP3 outputs.
4. System validates output files.
5. System saves final files directly to the local output folder.

### Validation Rules
- Audio file exists.
- Duration is valid (approximates the 15-minute target).
- No file corruption in input or output.
- Silence detection analysis on output files.

### Queue Behaviour
- Compilations are created and processed sequentially.
- Low-priority concurrency to prevent CPU hogging.

### Retry Behaviour
- Retry is not supported for this mode. Failed outputs are logged and skipped.

### Integration Rules
- No profile allowed.
- No uploader allowed.
- Output download/save only.

---

## Mode 3: Playlist Video Generator

### Purpose
Generate compiled playlist videos containing a collection of audio tracks overlaying a static image or a video background.

### Input Assets
- Background image OR background video.
- Multiple audio tracks.
- Configuration profile (required).

### Output Assets
- Compiled playlist videos.
- Default Quality: 720p (1080p optional).
- Generated thumbnail image.
- Generated timestamp list file.

### Workflow
1. User selects a profile.
2. User uploads the background image or background video.
3. User uploads the audio tracks.
4. System performs auto track parsing (retrieving duration and metadata).
5. System generates the playlist arrangement.
6. System generates a thumbnail for the output.
7. System generates the timestamp text file.
8. System applies optional intro (if configured).
9. System applies optional watermark (if configured).
10. System applies optional subscribe overlay (if configured).
11. System renders final video file via FFmpeg.
12. System runs validation on the rendered output.
13. System triggers the AutoUploader.

### Validation Rules
- Profile required.
- Audio and background assets validated for existance and format.
- Output video must pass render validation tests before upload.

### Queue Behaviour
- Full compilation jobs are queued and executed one-by-one.

### Retry Behaviour
- Automatic retry is supported (up to 2 times).

### Integration Rules
- Profile required.
- Validation required.
- AutoUploader integration active.
