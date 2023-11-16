'use client'
import { EntitySection } from "@/components/entity/entity-section"
import { EntityName } from "@/components/formatters/entity-name"
import { NumberFormatter } from "@/components/formatters/number-formatter"
import { FilledButton } from "@/components/material/filled-button"
import { FilledIconButton } from "@/components/material/filled-icon-button"
import { RankingsGrid } from "@/components/rankings/rankings-grid"
import { RankingsGridItem } from "@/components/rankings/rankings-grid-item"
import { RankingsSkeleton } from "@/components/rankings/rankings-skeleton"
import { GET_SONG_RANKINGS, buildEntityNames } from "@/lib/api"
import { ApiSongRankingsFilterResult } from "@/lib/api/types"
import { LanguageDictionary, getEntityName } from "@/localization"
import { useQuery } from "graphql-hooks"
import { useTheme } from "next-themes"
import { RankingsViewMode } from "../../rankings/types"
import { useSettings } from "../../../../components/providers/settings-provider"

export function TopSongs(
    {
        artistId,
        langDict,
        maxEntries,
        columnsClassName
    }: {
        artistId: number
        langDict: LanguageDictionary
        maxEntries: number
        columnsClassName?: string
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

    return rankingsResult != undefined && rankingsResult.totalCount === 0 ? undefined : <EntitySection
        title={langDict.artist_top_songs}
        titleSupporting={
            rankingsResult != undefined && rankingsResult.totalCount > maxEntries ? <>
                <FilledButton className="sm:flex hidden" text={langDict.artist_view_all} icon={'open_in_full'} href={`../rankings?includeArtists=${artistId}`} />
                <FilledIconButton className="sm:hidden flex" icon={'open_in_full'} href={`../rankings?includeArtists=${artistId}`} />
            </> : undefined
        }
    >
        <article className="mx-3">
            {
                error ? <ErrorMessage message={''} />
                    : loading ? <RankingsSkeleton elementCount={maxEntries} viewMode={RankingsViewMode.GRID} columnsClassName={columnsClassName} />
                        : rankingsResult == undefined || (rankingsResult && 0 >= rankingsResult.results.length) ? <ErrorMessage message={langDict.search_no_results} />
                            : <RankingsGrid columnsClassName={columnsClassName}>{rankingsResult.results.map(ranking => {
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
                            })}</RankingsGrid>
            }
        </article>
    </EntitySection>
}