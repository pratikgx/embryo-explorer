# 20-second walkthrough

This is a scripted walkthrough rendered with the actual application scene, controls and models, with a pointer and click cues added for the film. It does not alter the deployed site.

1. From the repository root, run `python3 scripts/video/prepare.py`.
2. Run `python3 -m http.server 8874 --directory work/walkthrough-site`.
3. Open `http://127.0.0.1:8874/recorder.html` with a 1920 × 1120 browser viewport.
4. Set the visible **Capture frame** input to each integer from 0 through 599. Wait for the parent body attribute `data-frame` to match. Save a screenshot cropped to x=0, y=0, width=1920, height=1080 as `work/walkthrough-frames/0000.jpg` through `0599.jpg`. The bottom recording controls stay outside this crop.
5. Encode the frames with FFmpeg:

```sh
ffmpeg -framerate 30 -i work/walkthrough-frames/%04d.jpg -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart -an media/embryo-explorer-walkthrough-20s.mp4
```

The capture driver defines the complete camera, selection, slider and pointer choreography. The film opens on all sixteen stages, separates their parts, focuses Week 24, inspects the heart, lungs, nervous system and fetus, then returns to the assembled overview. Duration: 20 seconds; 600 frames; 30 fps; 1920 × 1080; no audio.

Validation: all 600 frames decoded without errors. Duration, dimensions and frame rate verified. Key frames throughout the complete sequence were visually reviewed.

## Version with music

The current demo is [`media/embryo-explorer-walkthrough-with-music.mp4`](../../media/embryo-explorer-walkthrough-with-music.mp4). It uses Musinova’s “Calm Ambient Science Medical Tech” from Pixabay. See [third-party notices](../../THIRD_PARTY_NOTICES.md) for the source and license. The raw track is not included.

[`music-timing.json`](music-timing.json) records the source-to-output timing map and music offset. Retiming follows an estimated 141.975 BPM pulse. Use the existing captured frames and `score.py` with your own licensed download of the track to reproduce the edit:

```sh
python3 scripts/video/score.py /path/to/musinova-calm-ambient-science-medical-tech-362424.mp3
```

The script uses Python 3 and FFmpeg, writes a separate output, and leaves the silent film intact. The music starts about 13.117 seconds into the track, plays at 70% volume, fades in over 0.25 seconds and fades out over the final 1.1 seconds. The final video is 20 seconds, 1920 × 1080, 30 fps, with stereo AAC audio. All 600 frames and the audio stream decoded successfully; the audio peak measured −3.1 dBFS.
