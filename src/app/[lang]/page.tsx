import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Locale, getDictionary } from '@/localization'
import SongThumbnail from '@/components/song-thumbnail'
import { FilledButton } from '@/components/material/filled-button'

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
  return (
    <div className='w-full h-full flex flex-col gap-5 justify-start items-center'>
      <div className='w-full flex flex-col justify-start items-center gap-8 mt-2'>
        <div className='text-on-surface md:text-6xl font-extrabold text-4xl w-full text-center'>{langDict.home_rankings}</div>
        <div className='w-full text-center text-xl text-on-surface-variant max-w-3xl'>Explore vocal synthesizer songs that are ranked based on their total view counts with powerful filtering capabilities.</div>
        <FilledButton text={langDict.home_rankings_view} href={`/${locale}/rankings`} className='sm:w-fit w-full'></FilledButton>
        <div className='max-w-xl w-full flex flex-col bg-surface-2 rounded-2xl justify-center md:items-start items-center p-7 box-border gap-5 min-h-[250px]'>
          <DummyRanking
            rank={1}
            image='https://img.youtube.com/vi/2b1IexhKPz4/hqdefault.jpg'
          />
          <DummyRanking
            rank={2}
            image='https://img.youtube.com/vi/JW3N-HvU0MA/hqdefault.jpg'
          />
          <DummyRanking
            rank={3}
            image='https://img.youtube.com/vi/FkO8ub83wss/hqdefault.jpg'
          />
        </div>
      </div>
      <div className='mt-24 flex flex-wrap gap-5 max-w-6xl'>
        <LargeCard title={langDict.nav_singers} text='Interact with the most-viewed Vocaloids, CeVIO AI, and more.' href={`/${locale}/rankings/singers`} className='md:flex-1 w-full'>
          <div className='w-fit m-auto flex gap-6 items-center justify-center h-[192px] relative'>
            <Image
              priority
              width={300}
              height={192}
              src='https://static.vocadb.net/img/artist/mainThumb/83928.png?v=27'
              alt='KAFU'
              style={{ objectFit: 'contain' }}
              className='rounded-xl p-2 box-border border border-outline-variant max-h-[192px]'
            />
            <Image
              priority
              width={300}
              height={192}
              src='https://static.vocadb.net/img/artist/mainThumb/1.png?v=32'
              alt='Hatsune Miku'
              style={{ objectFit: 'contain' }}
              className='rounded-xl p-2 box-border border border-outline-variant max-h-[192px]'
            />
          </div>
        </LargeCard>
        <LargeCard title={langDict.home_trending} text='Explore songs that have been trending within the past day, week, or month. ' href={`/${locale}/rankings/trending`} className='md:flex-1 w-full'>
          <div className='h-[192px] w-fit m-auto flex gap-6 items-end justify-center'>
            <div className='flex flex-col gap-3 justify-start items-center h-1/2'>
              <SongThumbnail
                src='https://img.youtube.com/vi/2b1IexhKPz4/hqdefault.jpg'
                alt='Ranking Image'
                height={35}
                width={35}
              />
              <div className='w-[15px] rounded-full bg-surface-2 flex-1'></div>
            </div>
            <div className='flex flex-col gap-3 justify-start items-center h-3/4'>
              <SongThumbnail
                src='https://img.youtube.com/vi/JW3N-HvU0MA/hqdefault.jpg'
                alt='Ranking Image'
                height={35}
                width={35}
              />
              <div className='w-[15px] rounded-full bg-surface-2 flex-1'></div>
            </div>
            <div className='flex flex-col gap-3 justify-start items-center h-full'>
              <SongThumbnail
                src='https://img.youtube.com/vi/FkO8ub83wss/hqdefault.jpg'
                alt='Ranking Image'
                height={35}
                width={35}
              />
              <div className='w-[15px] rounded-full bg-surface-2 flex-1'></div>
            </div>
          </div>
        </LargeCard>
        <LargeCard title={langDict.nav_producers} text='Check out how your favorite producer ranks compared to others.' href={`/${locale}/rankings/producers`} className='md:flex-1 w-full'>
          <div className='w-fit m-auto grid grid-cols-2 gap-3'>
            <Image
              src='https://static.vocadb.net/img/artist/mainThumb/470.jpg?v=43'
              alt='Kikuo'
              height={90}
              width={90}
              className='rounded-xl'
              style={{ objectFit: "cover" }}
            />
            <div className='h-[90px] w-[90px] box-border border border-outline-variant rounded-xl'></div>
            <div className='h-[90px] w-[90px] box-border border border-outline-variant rounded-xl'></div>
            <Image
              src='https://static.vocadb.net/img/artist/mainThumb/65229.jpg?v=14'
              alt='Iyowa'
              height={90}
              width={90}
              className='rounded-xl'
              style={{ objectFit: "cover" }}
            />
          </div>
        </LargeCard>
      </div>
      <div className='flex flex-wrap gap-5 max-w-6xl'>
        <Card title={langDict.home_add_song} text="Can't find a song? Add it to the website to begin tracking its views." href={`/${locale}/song/add`} className='md:flex-1 w-full'/>
        <Card title={langDict.home_about} text="Want to know more about the site and how it works? The about page explains it all." href={`/${locale}/about`} className='md:flex-1 w-full'/>
        <Card title={langDict.home_settings} text="Visit the settings page to change the website's theme, language, and more. " href={`/${locale}/settings`} className='md:flex-1 w-full'/>
      </div>
    </div>
  )
}

function LargeCard(
  {
    children,
    title,
    text,
    href,
    className
  }: {
    children: React.ReactNode
    title: string
    text: string
    href: string,
    className?: string
  }
) {
  return (
    <Link href={href} className={`p-5 box-border border border-outline-variant rounded-2xl flex flex-col gap-2 hover:bg-surface-1 transition-colors ${className}`}>
      {children}
      <div className='mt-3 text-xl font-bold'>{title}</div>
      <div className='text-md text-on-surface-variant'>{text}</div>
    </Link>
  )
}

function Card(
  {
    title,
    text,
    href,
    className
  }: {
    title: string
    text: string
    href: string,
    className?: string
  }
) {
  return (
    <Link href={href} className={`p-5 box-border border border-outline-variant rounded-2xl flex flex-col gap-2 hover:bg-surface-1 transition-colors ${className}`}>
      <div className='text-xl font-bold'>{title}</div>
      <div className='text-md text-on-surface-variant'>{text}</div>
    </Link>
  )
}

function DummyRanking(
  {
    rank,
    image
  }: {
    rank: number
    image: string
  }
) {
  return (
    <div className='w-full box-border bg-surface-2 text-on-surface flex gap-[10px] px-[10px] py-[8px] items-center rounded-xl'>
      <div className='h-[30px] w-[30px] flex items-center justify-center text-xl'>{rank}</div>
      <SongThumbnail
        src={image}
        alt='Ranking Image'
        height={35}
        width={35}
      />
      <div className='h-[15px] rounded-full bg-surface-1 flex-[5]'></div>
      <div className='h-[15px] rounded-full bg-surface-1 flex-1'></div>
    </div>
  )
}