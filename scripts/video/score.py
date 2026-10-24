"""Reproduce the music edit from captured frames and a separately licensed MP3."""
import argparse
import bisect
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('music', type=Path)
parser.add_argument('--frames', type=Path, default=ROOT / 'work/walkthrough-frames')
parser.add_argument('--output', type=Path, default=ROOT / 'media/embryo-explorer-walkthrough-with-music.mp4')
parser.add_argument('--ffmpeg', default='ffmpeg')
args = parser.parse_args()
if not args.music.is_file():
    parser.error('Music file not found. Download the licensed track from the credited source.')
if not shutil.which(args.ffmpeg):
    parser.error('FFmpeg was not found. Install it or pass --ffmpeg /path/to/ffmpeg.')
plan = json.loads(Path(__file__).with_name('music-timing.json').read_text())
points = plan['timing']
output_times = [p['output_seconds'] for p in points]
source_times = [p['source_seconds'] for p in points]
count = round(plan['duration_seconds'] * 30)
args.output.parent.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix='embryo-music-') as temp:
    for frame in range(count):
        t = frame / 30
        segment = min(len(points) - 2, max(0, bisect.bisect_right(output_times, t) - 1))
        a, b = output_times[segment:segment + 2]
        source_time = source_times[segment] + (t - a) / (b - a) * (source_times[segment + 1] - source_times[segment])
        index = min(count - 1, max(0, round(source_time * 30)))
        source = args.frames / f'{index:04d}.jpg'
        if not source.is_file():
            parser.error(f'Missing captured frame: {source}. Follow the capture instructions first.')
        target = Path(temp) / f'{frame:04d}.jpg'
        try:
            os.link(source, target)
        except OSError:
            shutil.copyfile(source, target)
    subprocess.run([
        args.ffmpeg, '-y', '-hide_banner', '-loglevel', 'error',
        '-framerate', '30', '-i', str(Path(temp) / '%04d.jpg'),
        '-ss', str(plan['music_start_seconds']), '-i', str(args.music),
        '-map', '0:v:0', '-map', '1:a:0', '-t', str(plan['duration_seconds']),
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
        '-af', 'volume=0.7,afade=t=in:st=0:d=0.25,afade=t=out:st=18.9:d=1.1',
        '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart',
        str(args.output)
    ], check=True)
print(args.output)
