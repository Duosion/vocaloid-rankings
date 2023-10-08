import { CSSProperties } from "react"

export default function Image(
    {
      
      src,
      alt,
      height,
      width,
      fill,
      style,
      className,
      priority
    }: {
        src: string
        alt: string
        height?: number
        width?: number
        fill?: boolean
        style?: CSSProperties
        className?: string
        priority?: boolean
    }
) {
    return <img
        src={src}
        alt={alt}
        height={height}
        width={width}
        style={{
            width: fill ? '100%' : undefined,
            height: fill ? '100%' : undefined,
            ...style
        }}
        className={className}
    />
}