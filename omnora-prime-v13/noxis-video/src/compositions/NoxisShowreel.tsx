import { AbsoluteFill, Sequence } from 'remotion'
import { S01_Intro } from '../scenes/S01_Intro'
import { S02_Dashboard } from '../scenes/S02_Dashboard'
import { S03_POS } from '../scenes/S03_POS'
import { S04_Foresight } from '../scenes/S04_Foresight'
import { S05_ThemeEngine } from '../scenes/S05_ThemeEngine'
import { S06_FileMorph } from '../scenes/S06_FileMorph'
import { S07_TaxCompliance } from '../scenes/S07_TaxCompliance'
import { S08_Karigar } from '../scenes/S08_Karigar'
import { S09_Mobile } from '../scenes/S09_Mobile'
import { S10_Offline } from '../scenes/S10_Offline'
import { S11_AutoUpdate } from '../scenes/S11_AutoUpdate'
import { S12_CCTV } from '../scenes/S12_CCTV'
import { S13_Pricing } from '../scenes/S13_Pricing'
import { SceneTransition } from '../components/SceneTransition'

export const SHOWREEL_SCENES = [
  { component: S01_Intro, start: 0, duration: 240 }, // 8s Brand Intro
  { component: S02_Dashboard, start: 240, duration: 330 }, // 11s Authentic Dashboard
  { component: S03_POS, start: 570, duration: 330 }, // 11s POS Counter
  { component: S04_Foresight, start: 900, duration: 330 }, // 11s Foresight AI & Intelligence
  { component: S05_ThemeEngine, start: 1230, duration: 300 }, // 10s Theme Changing System
  { component: S06_FileMorph, start: 1530, duration: 330 }, // 11s File Conversion System
  { component: S07_TaxCompliance, start: 1860, duration: 330 }, // 11s Tax & Compliance
  { component: S08_Karigar, start: 2190, duration: 330 }, // 11s Karigars Attendance
  { component: S09_Mobile, start: 2520, duration: 330 }, // 11s Mobile Mesh Sync
  { component: S10_Offline, start: 2850, duration: 360 }, // 12s Power Cut Zero Loss
  { component: S11_AutoUpdate, start: 3210, duration: 330 }, // 11s Auto Update Engine
  { component: S12_CCTV, start: 3540, duration: 300 }, // 10s CCTV DVR Linking
  { component: S13_Pricing, start: 3840, duration: 330 }, // 11s Pricing & Pitch Outro
]

export const SHOWREEL_TOTAL_FRAMES = 4170 // 139 seconds (~2 minutes 19 seconds at 30 fps)

export const NoxisShowreel: React.FC = () => {
  return (
    <AbsoluteFill className="bg-[#060708]">
      {SHOWREEL_SCENES.map(({ component: Scene, start, duration }) => (
        <Sequence key={start} from={start} durationInFrames={duration}>
          <Scene from={0} />
          {start > 0 && <SceneTransition duration={15} />}
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
