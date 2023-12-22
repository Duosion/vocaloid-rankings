import { Locale, getDictionary } from "@/localization"
import { AddSongForm } from "./add-song-form"
import { Divider } from "@/components/material/divider"

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
    return (
        <section className="flex flex-col gap-5 w-full min-h-screen max-w-4xl">
            <h1 className="font-bold md:text-5xl md:text-left text-4xl text-center w-full mb-5">{langDict.add_song}</h1>

            <AddSongForm/>

            <Divider className=" m-0"/>

            <h2 className="text-2xl font-semibold">{langDict.add_song_instructions_title}</h2>
            <h3 className="text-lg">{langDict.add_song_instructions}</h3>
            <h3 className="text-lg">{langDict.add_song_format}</h3>
            <h3 className="text-lg px-4 py-2 border border-outline-variant rounded-2xl w-fit text-on-surface-variant">{langDict.add_song_format_example}</h3>
            <h3 className="text-lg">{langDict.add_song_example}</h3>
        </section>
    )

}