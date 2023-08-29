import Image from "next/image"
import Link from "next/link"
import { IconButton } from "./material"
import { SearchBar } from "./searchbar"
import { Locale, getDictionary } from "@/localization"

export default async function Navbar(
    {
        lang
    }: {
        lang: Locale
    }
) {
    const langDict = await getDictionary(lang)
    return (
        <header className="z-50 w-full h-[60px] px-[30px] py-[10px] box-border sticky top-0 backdrop-blur backdrop-saturate-200 before:w-full before:h-full before:absolute bg-[linear-gradient(var(--md-sys-color-background),transparent)] before:bg-background before:opacity-80 before:z-40 before:top-0 before:left-0">
            <nav className='z-50 relative w-full h-full flex items-center gap-[20px] m-auto'>
                <ul className='flex-1 flex items-center justify-start gap-[20px]'>
                    <Link href={`/${lang}`}>
                        <Image
                            src='/github-mark-white.png'
                            alt='favicon'
                            height={32}
                            width={32}
                        />
                    </Link>
                    <NavLink href={`/${lang}/rankings`} text={langDict.nav_rankings} />
                    <NavLink href={`/${lang}/rankings/trending`} text={langDict.nav_trending} />
                    <NavLink href={`/${lang}/rankings/singers`} text={langDict.nav_singers} />
                    <NavLink href={`/${lang}/rankings/producers`} text={langDict.nav_producers} />
                </ul>
                <SearchBar placeholder={langDict.search_hint}/>
                <IconButton icon='settings' href={`/${lang}/settings`}/>
            </nav>
        </header>
    )
}

function NavLink({
    href,
    text
  }: {
    href: string,
    text: string
  }) {
    return (
        <li>
            <Link href={href} className='text-on-background bg-transparent rounded-lg bold text-base font-bold box-border p-[5px] hover:text-primary'>{text}</Link>
        </li>
    )
  }