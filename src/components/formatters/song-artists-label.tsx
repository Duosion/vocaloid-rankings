'use client'
import { NameType } from "@/data/types";
import { buildEntityNames } from "@/lib/api";
import { ApiArtist, ApiSongArtistsCategories } from "@/lib/api/types";
import Link from "next/link";
import { EntityName } from "./entity-name";

export function SongArtistsLabel(
    {
        artists,
        categories,
        preferredNameType,
        maxVocalists = 2,
        maxProducers = 2,
        entitySeparator = ', ',
        categorySeparator = ' feat. ',
        theme
    }: {
        artists: ApiArtist[]
        categories: ApiSongArtistsCategories
        preferredNameType: NameType
        maxVocalists?: number
        maxProducers?: number
        entitySeparator?: string
        categorySeparator?: string
        theme?: string
    }
): React.ReactElement {

    const artistsMap = new Map(artists.map(artist => [artist.id, artist]))
    const vocalists: number[] = categories.vocalists
    const producers: number[] = categories.producers

    // create elements
    const generateArtistElements = (toGenerate: number[], max: number): JSX.Element[] => {
        const generated: JSX.Element[] = []
        const length = Math.min(max, toGenerate.length)
        for (let i = 0; i < length; i++) {
            const artistId = toGenerate[i]
            const artist = artistsMap.get(artistId)
            if (artist) {
                generated.push(<h4
                className="inline"
                    style={{
                        color: theme == 'dark' ? artist.darkColor : artist.lightColor
                    }}
                >
                    <Link
                        href={`artist/${artist.id}`}
                        className="text-on-surface-variant transition-colors hover:text-inherit"
                    >
                        <EntityName
                            names={buildEntityNames(artist.names)}
                            preferred={preferredNameType}
                        />
                    </Link>
                </h4>)
                if (i != (length - 1)) {
                    generated.push(<h4 className="inline">{entitySeparator}</h4>)
                }
            }
        }
        return generated
    }

    return (
        <div className="text-on-surface text-md inline">
            {generateArtistElements(producers, maxProducers)}
            {<h4 className="inline">{categorySeparator}</h4>}
            {generateArtistElements(vocalists, maxVocalists)}
        </div>
    )

}