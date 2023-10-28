import Image from '@/components/image';
import { imageDisplayModeStyles } from '@/lib/material/material';
import { ImageDisplayMode } from '@/lib/material/types';

export default function EntityThumbnail(
    {
        src,
        alt,
        imageDisplayMode = ImageDisplayMode.SONG,
        fill,
        width,
        height,
        fillColor
    }: {
        src: string
        alt: string
        imageDisplayMode?: ImageDisplayMode
        fill?: boolean
        width?: number
        height?: number
        fillColor?: string
    }
) {
    return (
        <div className={`overflow-hidden relative rounded-xl flex justify-center items-center`} style={{ height: fill ? '100%' : height, width: fill ? '100%' : width, minWidth: width, minHeight: height }}>
            <Image
            className='text-on-primary text-center flex items-center justify-center'
                fill
                src={src}
                alt={alt}
                style={{
                    backgroundColor: fillColor,
                    objectFit: "cover",
                    ...imageDisplayModeStyles[imageDisplayMode]
                }}
            />
        </div>
    )
}