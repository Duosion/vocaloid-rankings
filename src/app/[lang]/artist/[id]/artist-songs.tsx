import { EntitySection } from "@/components/entity/entity-section"
import { EntityName } from "@/components/formatters/entity-name"
import { NumberFormatter } from "@/components/formatters/number-formatter"
import { FilledButton } from "@/components/material/filled-button"
import { FilledIconButton } from "@/components/material/filled-icon-button"
import { RankingsGrid } from "@/components/rankings/rankings-grid"
import { RankingsGridItem } from "@/components/rankings/rankings-grid-item"
import { NameType, SongRankingsFilterResult } from "@/data/types"
import { LanguageDictionary, getEntityName } from "@/localization"

export function ArtistSongs(
    {
        title,
        langDict,
        titleLanguage,
        songRankingsResult,
        columnsClassName,
        href,
        minimal
    }: {
        title: string,
        langDict: LanguageDictionary
        titleLanguage: NameType
        songRankingsResult?: SongRankingsFilterResult
        columnsClassName?: string
        href?: string
        minimal?: boolean
    }
) {

    return songRankingsResult == undefined || songRankingsResult.totalCount === 0 ? undefined : <EntitySection
        title={title}
        titleSupporting={
            songRankingsResult != undefined && href != undefined ? <>
                <FilledButton className="sm:flex hidden" text={langDict.artist_view_all} icon={'open_in_full'} href={href} />
                <FilledIconButton className="sm:hidden flex" icon={'open_in_full'} href={href} />
            </> : undefined
        }
    >
        <article className={minimal ? undefined : "mx-3"}>
            {
                <RankingsGrid columnsClassName={columnsClassName}>{songRankingsResult.results.map(ranking => {
                    const song = ranking.song
                    const names = song.names

                    return (
                        <RankingsGridItem
                            key={song.id.toString()}
                            href={`../song/${song.id}`}
                            titleContent={<EntityName names={names} preferred={titleLanguage} />}
                            placement={minimal ? undefined : ranking.placement}
                            icon={song.thumbnail}
                            iconAlt={getEntityName(names, titleLanguage)}
                            trailingTitleContent={minimal ? undefined : <NumberFormatter number={ranking.views} compact />}
                            trailingSupporting={langDict.rankings_views}
                            color='var(--md-sys-color-primary)'
                            in
                        />
                    )
                })}</RankingsGrid>
            }
        </article>
    </EntitySection>
}