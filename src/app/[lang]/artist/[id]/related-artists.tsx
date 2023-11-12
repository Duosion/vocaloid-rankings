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
import { useQuery } from "@apollo/client"
import { useTheme } from "next-themes"
import { useSettings } from "../../settings/settings-provider"

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
        children?: JSX.Element | JSX.Element[]
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

    const subTitle = langDict['artist_related_artist_child']

    return rankingsResult != undefined && rankingsResult.totalCount === 0 ? undefined : <EntitySection
        title={langDict['artist_related_artists']}
    >
        <article className="mt-2">
            {
                error ? <ErrorMessage message={error.message} />
                    : loading ? <ArtistsSkeleton elementCount={maxEntries} className="xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2" />
                        : rankingsResult == undefined || (rankingsResult && 0 >= rankingsResult.results.length) ? <ErrorMessage message={langDict.search_no_results} />
                            : <ArtistsGrid className="xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2">
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
                                            text={''}
                                            isSinger={mapArtistTypeToCategory(mapArtistType(artist.type)) == ArtistCategory.VOCALIST}
                                        />
                                    )
                                })}
                            </ArtistsGrid>
            }
        </article>
    </EntitySection>
}