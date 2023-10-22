'use client'
import { EntityName } from "@/components/formatters/entity-name"
import { RankingListItem } from "@/components/rankings/rankings-list-item"
import { GET_SONG_RANKINGS, buildEntityNames } from "@/lib/api"
import { ApiSongRankingsFilterResult } from "@/lib/api/types"
import { LanguageDictionary, getEntityName } from "@/localization"
import { useQuery } from "@apollo/client"
import { useSettings } from "../../settings/settings-provider"
import { DummyRankingsListItem } from "@/components/rankings/dummy-rankings-list-item"
import { NumberFormatter } from "@/components/formatters/number-formatter"
import { SongArtistsLabel } from "@/components/formatters/song-artists-label"
import { DummyRankingsGridItem } from "@/components/rankings/dummy-rankings-grid-item"
import { RankingsGridItem } from "@/components/rankings/rankings-grid-item"
import { useTheme } from "next-themes"

export function TopSongs(
    {
        artistId,
        langDict
    }: {
        artistId: number
        langDict: LanguageDictionary
    }
) {
    // import contexts
    const { settings } = useSettings()
    const { resolvedTheme } = useTheme()

    // import settings
    const settingTitleLanguage = settings.titleLanguage

    // query graphql
    const { loading, error, data } = useQuery(GET_SONG_RANKINGS, {
        variables: {
            includeArtists: [artistId],
            maxEntries: 6,
        }
    })
    const rankingsResult = data?.songRankings as ApiSongRankingsFilterResult

    const ErrorMessage = ({ message }: { message: string }) => <h2 className="text-3xl font-bold text-center text-on-background">{message}</h2>

    // generate dummy rankings
    const dummyElements: JSX.Element[] = []
    if (loading) {
        for (let i = 0; i < 6; i++) {
            dummyElements.push(<DummyRankingsGridItem keyValue={i} />)
        }
    }

    return (
        <ol className="grid xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-4 grid-cols-3 px-5 gap-6 w-full mt-3 py-3">
            {
                error ? <ErrorMessage message={error.message} />
                    : loading ? dummyElements
                        : rankingsResult == undefined || (rankingsResult && 0 >= rankingsResult.results.length) ? <ErrorMessage message={langDict.search_no_results} />
                            : rankingsResult.results.map(ranking => {
                                const song = ranking.song
                                const names = buildEntityNames(song.names)

                                const color = resolvedTheme == 'dark' ? song.darkColor : song.lightColor

                                return (
                                    <RankingsGridItem
                                        key={song.id.toString()}
                                        href={`../song/${song.id}`}
                                        titleContent={<EntityName names={names} preferred={settingTitleLanguage} />}
                                        placement={ranking.placement}
                                        icon={song.thumbnail}
                                        iconAlt={getEntityName(names, settingTitleLanguage)}
                                        trailingTitleContent={<NumberFormatter number={ranking.views} compact/>}
                                        trailingSupporting={langDict.rankings_views}
                                        color={color}
                                        in
                                    />
                                )
                            })
            }
        </ol>
    )

}