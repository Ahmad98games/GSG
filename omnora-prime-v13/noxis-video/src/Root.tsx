import React from 'react'
import { Composition } from 'remotion'
import { NoxisShowreel, SHOWREEL_TOTAL_FRAMES } from './compositions/NoxisShowreel'
import { NoxisShort } from './compositions/NoxisShort'
import './index.css'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NoxisShowreel"
        component={NoxisShowreel}
        durationInFrames={SHOWREEL_TOTAL_FRAMES} // 2520 frames (84 seconds at 30fps)
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="NoxisShort"
        component={NoxisShort}
        durationInFrames={540} // 18 seconds at 30fps — Instagram/TikTok vertical
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  )
}
