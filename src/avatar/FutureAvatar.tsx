import { motion, useReducedMotion } from 'framer-motion'
import { useId, type CSSProperties } from 'react'
import './avatar.css'

/** The emotional vocabulary used by the future-self guide. */
export type AvatarMood =
  | 'calm'
  | 'happy'
  | 'worried'
  | 'thinking'
  | 'proud'
  | 'surprised'
  | 'warning'
  | 'relieved'
  | 'focused'
  | 'celebrating'
  | 'stressed'
  | 'encouraging'

export type AvatarSize = number | 'sm' | 'md' | 'lg'
export type AvatarVariant = 'portrait' | 'card' | 'glyph'

export interface FutureAvatarProps {
  mood?: AvatarMood
  size?: AvatarSize
  variant?: AvatarVariant
  speaking?: boolean
  /** An accessible description. Omit this for a decorative avatar. */
  label?: string
  className?: string
}

type Expression = {
  leftBrow: string
  rightBrow: string
  mouth: string
  cheekOpacity: number
  gaze: { x: number; y: number }
  eyeScaleY: number
  lidOpacity?: number
}

const expressions: Record<AvatarMood, Expression> = {
  calm: { leftBrow: 'M54 86 Q64 81 72 85', rightBrow: 'M94 85 Q103 81 112 86', mouth: 'M67 119 Q82 124 97 119', cheekOpacity: .26, gaze: { x: 0, y: 0 }, eyeScaleY: .92 },
  happy: { leftBrow: 'M54 85 Q64 79 73 84', rightBrow: 'M93 84 Q103 79 112 85', mouth: 'M66 116 Q82 131 98 116', cheekOpacity: .68, gaze: { x: 0, y: -1 }, eyeScaleY: 1 },
  worried: { leftBrow: 'M54 87 Q63 78 73 87', rightBrow: 'M93 87 Q103 78 112 87', mouth: 'M68 124 Q82 114 96 124', cheekOpacity: .14, gaze: { x: -1, y: 1 }, eyeScaleY: .78, lidOpacity: .2 },
  thinking: { leftBrow: 'M54 85 Q64 80 73 85', rightBrow: 'M93 88 Q103 82 112 84', mouth: 'M70 121 Q80 124 91 118', cheekOpacity: .18, gaze: { x: 2, y: -2 }, eyeScaleY: .88 },
  proud: { leftBrow: 'M54 84 Q64 78 73 84', rightBrow: 'M93 84 Q103 78 112 84', mouth: 'M66 117 Q82 126 98 117', cheekOpacity: .44, gaze: { x: 0, y: -2 }, eyeScaleY: .94 },
  surprised: { leftBrow: 'M54 80 Q64 74 73 80', rightBrow: 'M93 80 Q103 74 112 80', mouth: 'M77 116 Q82 112 87 116 L87 122 Q82 126 77 122 Z', cheekOpacity: .3, gaze: { x: 0, y: -1 }, eyeScaleY: 1.16 },
  warning: { leftBrow: 'M54 87 Q64 78 73 84', rightBrow: 'M93 84 Q103 78 112 87', mouth: 'M69 123 Q82 116 95 123', cheekOpacity: .08, gaze: { x: 0, y: 1 }, eyeScaleY: .8, lidOpacity: .18 },
  relieved: { leftBrow: 'M54 86 Q64 82 73 86', rightBrow: 'M93 86 Q103 82 112 86', mouth: 'M67 118 Q82 128 97 118', cheekOpacity: .38, gaze: { x: 0, y: 1 }, eyeScaleY: .88, lidOpacity: .12 },
  focused: { leftBrow: 'M54 89 Q64 84 73 88', rightBrow: 'M93 88 Q103 84 112 89', mouth: 'M69 120 Q82 122 95 120', cheekOpacity: .14, gaze: { x: 0, y: 0 }, eyeScaleY: .74, lidOpacity: .12 },
  celebrating: { leftBrow: 'M54 82 Q64 76 73 82', rightBrow: 'M93 82 Q103 76 112 82', mouth: 'M65 115 Q82 133 99 115', cheekOpacity: .74, gaze: { x: 0, y: -2 }, eyeScaleY: 1.08 },
  stressed: { leftBrow: 'M54 89 Q64 78 73 87', rightBrow: 'M93 87 Q103 78 112 89', mouth: 'M68 124 Q82 116 96 124', cheekOpacity: .1, gaze: { x: -1, y: 1 }, eyeScaleY: .72, lidOpacity: .26 },
  encouraging: { leftBrow: 'M54 85 Q64 79 73 84', rightBrow: 'M93 84 Q103 79 112 85', mouth: 'M67 118 Q82 128 97 118', cheekOpacity: .56, gaze: { x: 0, y: 0 }, eyeScaleY: .98 },
}

// Keep every frame on the same explicit cubic-path structure. Mixing relative
// shorthand commands made Framer Motion concatenate interpolated coordinates
// into invalid SVG path data in Chromium.
const horizonPaths = [
  'M23 151 C48 145 57 155 82 150 C107 145 116 144 143 151',
  'M23 151 C48 155 59 145 82 151 C105 157 120 157 143 150',
  'M23 151 C48 145 57 155 82 150 C107 145 116 144 143 151',
]

function sizeStyle(size: AvatarSize): CSSProperties | undefined {
  return typeof size === 'number' ? { '--future-avatar-size': `${size}px` } as CSSProperties : undefined
}

/** A blue, Arabic-first future-self guide designed to remain expressive at small sizes. */
export function FutureAvatar({
  mood = 'calm',
  size = 'md',
  variant = 'portrait',
  speaking = false,
  label,
  className = '',
}: FutureAvatarProps) {
  const reducedMotion = useReducedMotion()
  const rawId = useId()
  const uid = rawId.replace(/:/g, '')
  const skinId = `avatar-skin-${uid}`
  const fabricId = `avatar-fabric-${uid}`
  const auraId = `avatar-aura-${uid}`
  const horizonId = `avatar-horizon-${uid}`
  const expression = expressions[mood]
  const isCelebrating = mood === 'celebrating'
  const isGlyph = variant === 'glyph'
  const classNames = ['future-avatar', `future-avatar--${mood}`, `future-avatar--${variant}`, typeof size === 'string' ? `future-avatar--${size}` : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classNames}
      style={sizeStyle(size)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-speaking={speaking || undefined}
    >
      <motion.svg
        viewBox="0 0 166 184"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        initial={reducedMotion ? false : { opacity: 0, scale: .94, y: 5 }}
        animate={reducedMotion ? undefined : { opacity: 1, scale: [1, 1.012, 1], y: [0, -1.5, 0] }}
        transition={reducedMotion ? undefined : { opacity: { duration: .35 }, scale: { duration: 5.4, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 5.4, repeat: Infinity, ease: 'easeInOut' } }}
      >
        <defs>
          <linearGradient id={skinId} x1="56" y1="54" x2="113" y2="145" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F5C6A8" />
            <stop offset=".52" stopColor="#DEA083" />
            <stop offset="1" stopColor="#BF735F" />
          </linearGradient>
          <linearGradient id={fabricId} x1="42" y1="31" x2="126" y2="171" gradientUnits="userSpaceOnUse">
            <stop stopColor="#245AA7" />
            <stop offset=".48" stopColor="#123C78" />
            <stop offset="1" stopColor="#092855" />
          </linearGradient>
          <radialGradient id={auraId} cx="0" cy="0" r="1" gradientTransform="translate(83 91) rotate(90) scale(80)">
            <stop stopColor="#56B9FF" stopOpacity=".48" />
            <stop offset=".58" stopColor="#1269C7" stopOpacity=".18" />
            <stop offset="1" stopColor="#061B4C" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={horizonId} x1="30" y1="145" x2="139" y2="156" gradientUnits="userSpaceOnUse">
            <stop stopColor="#77D8FF" stopOpacity="0" />
            <stop offset=".45" stopColor="#B7EEFF" />
            <stop offset="1" stopColor="#77D8FF" stopOpacity="0" />
          </linearGradient>
        </defs>

        <motion.circle className="future-avatar__aura" cx="83" cy="88" r="75" fill={`url(#${auraId})`} animate={reducedMotion ? undefined : { scale: [1, 1.08, 1], opacity: [.65, .92, .65] }} transition={{ duration: 6.7, repeat: Infinity, ease: 'easeInOut' }} />
        <path className="future-avatar__contour future-avatar__contour--outer" d="M25 126C16 86 31 33 83 22c52 11 67 64 58 104" />
        <path className="future-avatar__contour" d="M34 121C27 87 40 42 83 31c43 11 56 56 49 90" />
        <motion.path className="future-avatar__horizon" d={horizonPaths[0]} stroke={`url(#${horizonId})`} animate={reducedMotion ? undefined : { d: horizonPaths }} transition={{ duration: 7.2, repeat: Infinity, ease: 'easeInOut' }} />

        <path className="future-avatar__hijab-back" d={isGlyph ? 'M45 126C40 101 40 64 53 43 64 25 81 19 97 25c18 7 27 28 29 53 2 19 0 40-5 60l-18 18H63Z' : 'M34 151C33 119 36 75 49 44 59 21 77 15 94 20c21 6 34 25 39 53 5 28 3 62-1 89l-18 21H52Z'} fill={`url(#${fabricId})`} />
        {!isGlyph && <path className="future-avatar__abaya" d="M24 180c5-28 27-43 59-43s54 15 59 43Z" />}
        <path className="future-avatar__face" d="M55 68C55 47 66 34 83 34c17 0 28 13 28 34v29c0 22-10 39-28 44-18-5-28-22-28-44Z" fill={`url(#${skinId})`} />
        <path className="future-avatar__hijab-frame" d="M49 76C49 45 62 27 83 27c21 0 34 20 34 49l-9 4c-1-24-10-38-25-38-16 0-25 14-25 38Z" fill={`url(#${fabricId})`} />
        <path className="future-avatar__hijab-drape" d="M45 109C48 136 61 151 83 151c22 0 35-15 38-42l8 9c-3 26-16 43-32 51l-14-15-13 15c-17-10-29-27-33-51Z" fill={`url(#${fabricId})`} />
        {!isGlyph && <>
          <path className="future-avatar__hijab-rim" d="M57 79C58 56 67 42 83 42c16 0 25 14 26 38" />
          <path className="future-avatar__hijab-fold" d="M45 118c7 21 19 34 38 39m38-39c-7 21-19 34-38 39m-21 7c7-5 14-8 21-8 8 0 15 3 22 8" />
        </>}

        <motion.g animate={reducedMotion ? undefined : { x: expression.gaze.x, y: expression.gaze.y }} transition={{ type: 'spring', stiffness: 80, damping: 14 }}>
          <path className="future-avatar__brow" d={expression.leftBrow} />
          <path className="future-avatar__brow" d={expression.rightBrow} />
          <motion.g animate={reducedMotion ? undefined : { scaleY: [expression.eyeScaleY, expression.eyeScaleY, .1, expression.eyeScaleY, expression.eyeScaleY] }} transition={{ duration: 4.8, repeat: Infinity, repeatDelay: 1.8, times: [0, .4, .46, .53, 1] }} style={{ transformOrigin: '83px 100px', transform: reducedMotion ? `scaleY(${expression.eyeScaleY})` : undefined }}>
            <path className="future-avatar__eye" d="M57 100Q63.5 95.7 70 100q-6.5 4.3-13 0Zm39 0q6.5-4.3 13 0-6.5 4.3-13 0Z" />
            <path className="future-avatar__eye-line" d="M57 100Q63.5 95.7 70 100M96 100q6.5-4.3 13 0" />
            <circle className="future-avatar__pupil" cx="64" cy="100" r="1.85" />
            <circle className="future-avatar__pupil" cx="102" cy="100" r="1.85" />
          </motion.g>
        </motion.g>
        {!isGlyph && <>
          <ellipse className="future-avatar__cheek" cx="61" cy="113" rx="10" ry="5" opacity={expression.cheekOpacity} />
          <ellipse className="future-avatar__cheek" cx="105" cy="113" rx="10" ry="5" opacity={expression.cheekOpacity} />
          <path className="future-avatar__jaw" d="M60 121Q68 138 83 141Q98 138 106 121" />
          <path className="future-avatar__nose" d="M83 96c0 7-2 13 1 16 2 2 4 2 6 0" />
        </>}
        <motion.path className="future-avatar__mouth" d={expression.mouth} animate={speaking && !reducedMotion ? { scaleY: [1, 1.45, .84, 1.3, 1] } : undefined} transition={{ duration: .58, repeat: speaking ? Infinity : 0, ease: 'easeInOut' }} style={{ transformOrigin: '82px 120px' }} />
        {expression.lidOpacity ? <path className="future-avatar__lid" d="M55 98q9 6 18 0M93 98q9 6 18 0" opacity={expression.lidOpacity} /> : null}

        {isCelebrating && !reducedMotion ? <motion.g className="future-avatar__confetti" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], y: [0, -8, 10], rotate: [0, 70, 130] }} transition={{ duration: 1.7, repeat: 0, ease: 'easeOut' }}>
          <path d="m37 61 5-4 2 6-5 3Z" /><path d="m124 50 4 2-3 6-4-2Z" /><circle cx="135" cy="78" r="2" /><circle cx="31" cy="86" r="2" />
        </motion.g> : null}
        {!isGlyph && <circle className="future-avatar__glint" cx="119" cy="56" r="2.6" />}
      </motion.svg>
    </div>
  )
}

export interface AvatarBadgeProps extends Omit<FutureAvatarProps, 'variant' | 'size'> {
  size?: AvatarSize
  /** A compact card treatment, retaining a recognisable future-self glyph. */
  variant?: 'card' | 'glyph'
}

export function AvatarBadge({ size = 'sm', variant = 'card', className = '', ...props }: AvatarBadgeProps) {
  return <FutureAvatar {...props} size={size} variant={variant} className={`avatar-badge ${className}`.trim()} />
}
