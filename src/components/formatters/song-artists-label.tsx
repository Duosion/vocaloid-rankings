'use client'
import { NameType } from "@/data/types";
import { EntityName } from "./entity-name";
import Link from "next/link";
import { ApiArtist } from "@/lib/api/types";
import { buildEntityNames } from "@/lib/api";

export function SongArtistsLabel(
    {
        artists,
        preferredNameType,
        maxVocalists = 2,
        maxProducers = 2,
        entitySeparator = ', ',
        categorySeparator = ' feat. ',
    }: {
        artists: ApiArtist[]
        preferredNameType: NameType
        maxVocalists?: number,
        maxProducers?: number,
        entitySeparator?: string,
        categorySeparator?: string,
    }
): React.ReactElement {

    const vocalists: ApiArtist[] = []
    const producers: ApiArtist[] = []

    // separate vocalists and producers
    for (const artist of artists) {
        if (artist.category == 'PRODUCER' && producers.length < maxProducers ) {
            producers.push(artist)
        } else if (artist.category == 'VOCALIST' && vocalists.length < maxVocalists) {
            vocalists.push(artist)
        }
    }

    // create elements
    const generateArtistElements = (toGenerate: ApiArtist[]): JSX.Element[] => {
        const generated: JSX.Element[] = []
        const length = toGenerate.length
        for (let i = 0; i < length; i++) {
            const artist = toGenerate[i]
            generated.push(<Link href={`artist/${artist.id}`} className="text-on-surface-variant transition-colors hover:text-on-surface inline"><EntityName names={buildEntityNames(artist.names)} preferred={preferredNameType}/></Link>)
            if (i != (length - 1)) {
                generated.push(<h4 className="inline">{entitySeparator}</h4>)
            }
        }
        return generated
    }
    

    return (
        <div className="text-on-surface text-md inline">
            {generateArtistElements(producers)}
            {<h4 className="inline">{categorySeparator}</h4>}
            {generateArtistElements(vocalists)}
        </div>
    )

}