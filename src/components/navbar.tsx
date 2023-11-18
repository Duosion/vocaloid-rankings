'use client'
import Image from '@/components/image'
import Link from "next/link"
import { MouseEventHandler, useState } from 'react'
import { Icon } from './material/icon'
import { IconButton } from "./material/icon-button"
import { useLocale } from './providers/language-dictionary-provider'
import { SearchBar } from "./search-bar"
import { ModalDrawer } from './transitions/modal-drawer'

export default function Navbar(
    {
        lang
    }: {
        lang: string
    }
) {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const langDict = useLocale()

    const closeDrawer = () => setDrawerOpen(false)

    return (
        <header className="z-50 w-full h-15 px-7 py-2 box-border sticky top-0 backdrop-blur backdrop-saturate-200 before:w-full before:h-full before:absolute bg-[linear-gradient(var(--md-sys-color-background),transparent)] before:bg-background before:opacity-80 before:z-40 before:top-0 before:left-0">
            {/* nav drawer */}
            <ModalDrawer visible={drawerOpen} onClose={closeDrawer}>
                <ul className='flex w-full gap-5'>
                    {/* search bar */}
                    <SearchBar key={'nav-drawer-search'} className='flex-1' placeholder={langDict.search_hint} />
                    {/* settings button */}
                    <IconButton key='nav-drawer-settings' icon='settings' href={`/${lang}/settings`} onClick={closeDrawer} />
                </ul>
                <ul className='flex flex-col w-full'>
                    <NavDrawerLink icon='menu' href={`/${lang}/rankings`} text={langDict.nav_rankings} onClick={closeDrawer} />
                    <NavDrawerLink icon='trending_up' href={`/${lang}/rankings/trending`} text={langDict.nav_trending} onClick={closeDrawer} />
                    <NavDrawerLink icon='mic' href={`/${lang}/rankings/singers`} text={langDict.nav_singers} onClick={closeDrawer} />
                    <NavDrawerLink icon='music_note' href={`/${lang}/rankings/producers`} text={langDict.nav_producers} onClick={closeDrawer} />
                </ul>
            </ModalDrawer>

            <nav className='z-40 relative w-full h-full flex items-center gap-5 m-auto'>
                <ul className='flex-1 flex items-center justify-start gap-5'>
                    {/* modal nav drawer button */}
                    <IconButton icon='menu' className='lg:hidden flex' onClick={() => setDrawerOpen(true)} />

                    {/* favicon */}
                    <Link href={`/${lang}`}>
                        <Image
                            src='/github-mark-white.png'
                            alt='favicon'
                            height={32}
                            width={32}
                        />
                    </Link>

                    {/* nav links */}
                    <div key='nav-links'>
                        <ul className='sm:flex hidden gap-5'>
                            <NavLink href={`/${lang}/rankings`} text={langDict.nav_rankings} />
                            <NavLink href={`/${lang}/rankings/trending`} text={langDict.nav_trending} />
                            <NavLink href={`/${lang}/rankings/singers`} text={langDict.nav_singers} />
                            <NavLink href={`/${lang}/rankings/producers`} text={langDict.nav_producers} />
                        </ul>
                    </div>

                </ul>
                {/* search bar */}
                <SearchBar className='min-w-[360px] max-w-[420px] lg:flex hidden' placeholder={langDict.search_hint} />

                {/* settings button */}
                <IconButton icon='settings' className='sm:flex hidden' href={`/${lang}/settings`} />
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
        <li key={text}>
            <Link href={href} className='text-on-background bg-transparent rounded-lg bold text-base font-bold box-border p-[5px] hover:text-primary transition-colors'>{text}</Link>
        </li>
    )
}

function NavDrawerLink(
    {
        href,
        text,
        icon,
        onClick
    }: {
        href: string,
        text: string,
        icon: string,
        onClick?: MouseEventHandler
    }
) {
    return (
        <li key={text}>
            <Link href={href} onClick={onClick} className='flex items-center justify-start gap-5 text-on-surface-variant w-full h-14 rounded-full px-4 hover:text-green-50 transition-colors'>
                <Icon icon={icon} />
                <div className='text-lg text-inherit'>{text}</div>
            </Link>
        </li>
    )
}