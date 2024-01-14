import { Locale, getDictionary } from "@/localization"
import { Metadata } from "next"
import Markdown from "react-markdown"

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
        title: langDict.home_about,
    }
}

export default async function AddSongPage(
    {
        params
    }: {
        params: {
            lang: Locale
        }
    }
) {
    // import language dictionary
    const lang = params.lang
    const langDict = await getDictionary(lang)

    const markdown = await import(`@/localization/docs/${lang}/about.md`).then(module => module.default)

    return (
        <section className="flex flex-col gap-5 w-full min-h-screen max-w-4xl">
            <h1 className="font-bold md:text-5xl md:text-left text-4xl text-center w-full mb-5">{langDict.home_about}</h1>
            <Markdown className='prose prose-md prose-material max-w-full'>{markdown}</Markdown>
        </section>
    )

}