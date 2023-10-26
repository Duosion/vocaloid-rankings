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
import { EntitySection } from "@/components/entity/entity-section"
import { FilledButton } from "@/components/material/filled-button"
import { FilledIconButton } from "@/components/material/filled-icon-button"

export function TopSongs(
    {
        artistId,
        langDict,
        maxEntries
    }: {
        artistId: number
        langDict: LanguageDictionary
        maxEntries: number
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
            maxEntries: maxEntries,
        }
    })
    const rankingsResult = data?.songRankings as ApiSongRankingsFilterResult

    const ErrorMessage = ({ message }: { message: string }) => <h2 className="text-3xl font-bold text-center text-on-background">{message}</h2>

    // generate dummy rankings
    const dummyElements: JSX.Element[] = []
    if (loading) {
        for (let i = 0; i < maxEntries; i++) {
            dummyElements.push(<DummyRankingsGridItem keyValue={i} />)
        }
    }

    return (
        <EntitySection
            title={langDict.artist_top_songs}
            titleSupporting={
                rankingsResult != undefined && rankingsResult.totalCount > maxEntries ? <>
                    <FilledButton className="sm:flex hidden" text={langDict.artist_view_all} icon={'open_in_full'} href={`../rankings?includeArtists=${artistId}`} />
                    <FilledIconButton className="sm:hidden flex" icon={'open_in_full'} href={`../rankings?includeArtists=${artistId}`} />
                </> : undefined
            }
        >
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
                                            trailingTitleContent={<NumberFormatter number={ranking.views} compact />}
                                            trailingSupporting={langDict.rankings_views}
                                            color={color}
                                            in
                                        />
                                    )
                                })
                }
            </ol>
        </EntitySection>

    )

}