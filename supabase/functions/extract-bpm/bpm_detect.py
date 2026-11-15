import sys
import librosa

audio_path = sys.argv[1]
y, sr = librosa.load(audio_path, sr=22050, mono=True)
tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
print(int(round(tempo)))