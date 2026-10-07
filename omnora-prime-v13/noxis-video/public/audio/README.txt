Place a royalty-free background track here.
Recommended: instrumental corporate background, 80-90 BPM.
Good sources:
  pixabay.com/music (free commercial use)
  freemusicarchive.org
  artlist.io (paid, best quality)

File name: background.mp3
In NoxisShowreel.tsx add after imports:
import { Audio, staticFile } from 'remotion'

Inside the component add:
<Audio
  src={staticFile('audio/background.mp3')}
  volume={0.15}
  // Low volume so voice-over can be added in post if needed
/>
