'use client'
import { ArtistCard } from "@/components/entity/artist-card"
import ArtistsGrid from "@/components/entity/artists-grid"
import { ArtistsSkeleton } from "@/components/entity/artists-skeleton"
import { EntitySection } from "@/components/entity/entity-section"
import { EntityName } from "@/components/formatters/entity-name"
import { ArtistCategory } from "@/data/types"
import { GET_ARTIST_RANKINGS, buildEntityNames, mapArtistType } from "@/lib/api"
import { ApiArtistRankingsFilterResult } from "@/lib/api/types"
import { mapArtistTypeToCategory } from "@/lib/utils"
import { LanguageDictionary, getEntityName } from "@/localization"
import { useQuery } from "graphql-hooks"
import { useTheme } from "next-themes"
import { useSettings } from "../../../../components/providers/settings-provider"

export function RelatedArtists(
    {
        artistId,
        langDict,
        maxEntries,
        children
    }: {
        artistId: number
        langDict: LanguageDictionary
        maxEntries: number
        children?: React.ReactNode
    }
) {
    // import contexts
    const { settings } = useSettings()
    const { resolvedTheme } = useTheme()

    // import settings
    const settingTitleLanguage = settings.titleLanguage

    // query graphql
    const { loading, error, data } = useQuery(GET_ARTIST_RANKINGS, {
        variables: {
            parentArtistId: artistId,
            maxEntries: maxEntries,
        }
    })
    const rankingsResult = data?.artistRankings as ApiArtistRankingsFilterResult

    const ErrorMessage = ({ message }: { message: string }) => <h2 className="text-3xl font-bold text-center text-on-background">{message}</h2>

    return rankingsResult != undefined && rankingsResult.totalCount === 0 && children == undefined ? undefined : <EntitySection
        title={langDict['artist_related_artists']}
    >
        <article>
            {
                error ? <ErrorMessage message={''} />
                    : loading ? <ArtistsSkeleton elementCount={maxEntries} className="xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2" />
                        : <ArtistsGrid className="xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2">
                            {children}
                            {rankingsResult.results.map(ranking => {
                                const artist = ranking.artist
                                const names = buildEntityNames(artist.names)

                                const color = resolvedTheme == 'dark' ? artist.darkColor : artist.lightColor

                                return (
                                    <ArtistCard
                                        key={artist.id}
                                        src={artist.thumbnails.small || artist.thumbnails.original}
                                        alt={getEntityName(names, settingTitleLanguage)}
                                        bgColor={color}
                                        href={`../artist/${artist.id}`}
                                        title={<EntityName names={names} preferred={settingTitleLanguage} />}
                                        isSinger={mapArtistTypeToCategory(mapArtistType(artist.type)) == ArtistCategory.VOCALIST}
                                    />
                                )
                            })}
                        </ArtistsGrid>
            }
        </article>
    </EntitySection>
}