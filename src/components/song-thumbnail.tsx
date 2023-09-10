import Image from "next/image";

export default function SongThumbnail(
    {
        src,
        alt,
        width,
        height,
        overflowWidth = 55,
        overflowHeight = 55
    }: {
        src: string
        alt: string
        width: number
        height: number
        overflowWidth?: number
        overflowHeight?: number
    }
) {
    return (
        <div className={`overflow-hidden relative rounded-xl flex justify-center items-center`} style={{height: height, width: width, minWidth: width, minHeight: height}}>
            <figure className={`relative`} style={{height: overflowHeight, width: overflowWidth}}>
                <Image
                    fill
                    src={src}
                    alt={alt}
                    style={{ objectFit: "cover" }}
                />
            </figure>
        </div>
    )
}