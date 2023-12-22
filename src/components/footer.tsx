import { Locale, getDictionary } from "@/localization";
import Link from "next/link";
import { Divider } from "./material/divider";

export default async function Footer(
    {
        lang
    }: {
        lang: Locale
    }
) {
    const langDict = await getDictionary(lang)
    return (
        <footer>
            <Divider className="max-w-screen-2xl"/>
            <ul className="w-full min-h-24 h-fit box-border p-7 flex justify-center items-center gap-7 flex-wrap">
                <FooterLink text={langDict.add_song} href={`/${lang}/song/add`}/>
                <FooterLink text={langDict.footer_source_code} href='https://github.com/Duosion/vocaloid-rankings' />
                <FooterLink text={langDict.footer_community} href='https://discord.gg/By7z2kKVjx' />
            </ul>
        </footer>
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