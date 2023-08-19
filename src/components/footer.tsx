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
            <div className="w-full max-w-7xl bg-outline-variant opacity-50 h-[1px] m-auto"></div>
            <div className="w-full h-24 box-border p-7 flex justify-center items-center gap-7 flex-wrap">
                <FooterLink text={langDict.home_about} href='/about' />
                <FooterLink text={langDict.add_song} href='/song/add' />
                <FooterLink text={langDict.footer_source_code} href='https://github.com/Duosion/vocaloid-rankings' />
                <FooterLink text={langDict.footer_community} href='https://discord.gg/By7z2kKVjx' />
            </div>
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
        <Link className="text-on-background text-md hover:text-primary transition-colors" href={href}>{text}</Link>
    )
}