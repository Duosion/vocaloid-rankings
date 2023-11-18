import { EntitySection } from "@/components/entity/entity-section"
import { EntityName } from "@/components/formatters/entity-name"
import { NumberFormatter } from "@/components/formatters/number-formatter"
import { FilledButton } from "@/components/material/filled-button"
import { FilledIconButton } from "@/components/material/filled-icon-button"
import { RankingsGrid } from "@/components/rankings/rankings-grid"
import { RankingsGridItem } from "@/components/rankings/rankings-grid-item"
import { RankingsItemTrailing } from "@/components/rankings/rankings-item-trailing"
import { FilterOrder, NameType, SongRankingsFilterResult } from "@/data/types"
import { LanguageDictionary, getEntityName } from "@/localization"
import { getRankingsItemTrailingSupportingText } from "../../rankings/utils"

export function ArtistSongs(
    {
        title,
        langDict,
        titleLanguage,
        mode,
        songRankingsResult,
        columnsClassName,
        href,
        compact = false
    }: {
        title: string,
        langDict: LanguageDictionary
        titleLanguage: NameType
        mode: FilterOrder
        songRankingsResult?: SongRankingsFilterResult
        columnsClassName?: string
        href?: string
        compact?: boolean
    }
) {

    return songRankingsResult == undefined ? undefined : <EntitySection
        title={title}
        titleSupporting={
            songRankingsResult != undefined && href != undefined ? <>
                <FilledButton className="sm:flex hidden" text={langDict.artist_view_all} icon={'open_in_full'} href={href} />
                <FilledIconButton className="sm:hidden flex" icon={'open_in_full'} href={href} />
            </> : undefined
        }
    >
        <article>
            {
                <RankingsGrid columnsClassName={columnsClassName}>{songRankingsResult.results.map(ranking => {
                    const song = ranking.song
                    const names = song.names

                    return (
                        <RankingsGridItem
                            key={song.id.toString()}
                            href={`../song/${song.id}`}
                            titleContent={<EntityName names={names} preferred={titleLanguage} />}
                            placement={ranking.placement}
                            icon={song.thumbnail}
                            iconAlt={getEntityName(names, titleLanguage)}
                            trailingTitleContent={
                                <RankingsItemTrailing
                                    compact={compact}
                                    mode={mode}
                                    value={ranking.views}
                                    publishDate={song.publishDate}
                                    additionDate={song.additionDate}
                                />
                            }
                            trailingSupporting={getRankingsItemTrailingSupportingText(mode, langDict.rankings_views, undefined, langDict.rankings_publish_date, undefined)}
                            color='var(--md-sys-color-primary)'
                        />
                    )
                })}</RankingsGrid>
            }
        </article>
    </EntitySection>
}