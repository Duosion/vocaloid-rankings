import { Locale, getDictionary } from "@/localization";
import Link from "next/link";

export default async function Footer(
    {
        lang
    }: {
        lang: Locale
    }
) {
    const langDict = await getDictionary(lang)
    return (
        <>
            <hr className="w-full max-w-7xl opacity-50 border-outline-variant border-t-1 m-auto"/>
            <ul className="w-full min-h-24 h-fit box-border p-7 flex justify-center items-center gap-7 flex-wrap">
                <FooterLink text={langDict.home_about} href='/about' />
                <FooterLink text={langDict.add_song} href='/song/add' />
                <FooterLink text={langDict.footer_source_code} href='https://github.com/Duosion/vocaloid-rankings' />
                <FooterLink text={langDict.footer_community} href='https://discord.gg/By7z2kKVjx' />
            </ul>
        </>
    )
}

function FooterLink(
    {
        text,
        href
    }:
        {
            text: string,
            href: string
        }
) {
    return (
        <li><Link className="text-on-background text-md hover:text-primary transition-colors" href={href}>{text}</Link></li>
    )
}