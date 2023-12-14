import { FilledButton } from '@/components/material/filled-button'
import { filterSongRankings } from '@/data/songsData'
import { FilterOrder, SongRankingsFilterParams } from '@/data/types'
import { buildFuzzyDate } from '@/lib/utils'
import { Locale, getDictionary } from '@/localization'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArtistSongs } from './artist/[id]/artist-songs'
import { Settings } from './settings'
import { cookies } from 'next/dist/client/components/headers'
import { RankingsItemTrailingMode } from '@/components/rankings/rankings-item-trailing'

export async function generateMetadata(
  {
    params
  }: {
    params: {
      lang: Locale
    }
  }
): Promise<Metadata> {
  const langDict = await getDictionary(params.lang)

  return {
    title: langDict.home_rankings
  }
}

export default async function Home(
  {
    params
  }: {
    params: {
      lang: Locale
    }
  }
) {
  const locale = params.lang
  const langDict = await getDictionary(locale)
  
  // get settings
  const settings = new Settings(cookies())

  // general variables
  const settingTitleLanguage = settings.titleLanguage

  // get songs released today
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()

  const songBirthdaysParams = new SongRankingsFilterParams()
  songBirthdaysParams.publishDate = buildFuzzyDate(undefined, currentMonth.toString(), currentDay.toString())
  songBirthdaysParams.maxEntries = 6
  const songBirthdays = await filterSongRankings(songBirthdaysParams)
  
  return (
    <article className='w-full h-fit flex flex-col gap-5 justify-start items-center'>
      <section className='w-full flex flex-col justify-start items-center gap-8 mt-28'>
        <h1 className='text-on-surface md:text-6xl font-extrabold text-4xl w-full text-center'>{langDict.home_rankings}</h1>
        <h2 className='w-full text-center text-xl text-on-surface-variant max-w-3xl'>{langDict.home_rankings_info}</h2>
        <FilledButton text={langDict.home_rankings_view} href={`/${locale}/rankings`} className='sm:w-fit w-full'></FilledButton>
      </section>
      <ul className='mt-24 flex flex-wrap gap-5 max-w-6xl'>
        <Card title={langDict.nav_singers} text={langDict.home_singers_info} href={`/${locale}/rankings/singers`} />
        <Card title={langDict.home_trending} text={langDict.home_trending_info} href={`/${locale}/rankings/trending`} />
        <Card title={langDict.nav_producers} text={langDict.home_producers_info} href={`/${locale}/rankings/producers`} />
      </ul>
      <ul className='flex flex-wrap gap-5 max-w-6xl'>
        <Card title={langDict.home_add_song} text={langDict.home_add_song_info} href={`/${locale}/song/add`} />
        <Card title={langDict.home_about} text={langDict.home_about_info} href={`/${locale}/about`} />
        <Card title={langDict.home_settings} text={langDict.home_settings_info} href={`/${locale}/settings`} />
      </ul>

      <div className='grid gap-5 sm:grid-cols-1 grid-cols-1 w-full max-w-6xl mt-10'>
        <section>
          <ArtistSongs
            title={langDict.home_published_on_this_day}
            langDict={langDict}
            titleLanguage={settingTitleLanguage}
            mode={RankingsItemTrailingMode.YEARS_SINCE_PUBLISH}
            columnsClassName='lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2'
            songRankingsResult={songBirthdays}
            href={songBirthdays.totalCount > songBirthdaysParams.maxEntries ? `${locale}/rankings?publishMonth=${currentMonth}&publishDay=${currentDay}` : undefined}
          />
        </section>
      </div>

    </article>
  )
}

function Card(
  {
    title,
    text,
    href
  }: {
    title: string
    text: string
    href: string
  }
) {
  return (
    <Link key={href} href={href} className={`p-5 box-border border border-outline-variant rounded-2xl flex flex-col gap-2 transition-colors hover:bg-surface-container-lowest md:flex-1 w-full`}>
      <h4 className='text-xl font-bold'>{title}</h4>
      <h5 className='text-md text-on-surface-variant'>{text}</h5>
    </Link>
  )
}