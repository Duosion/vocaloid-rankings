import { Locale, getDictionary } from "@/localization"
import { Divider } from "@/components/material/divider"
import { Metadata } from "next"
import { LoginForm } from "./login-form"

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
        title: langDict.add_song,
    }
}

export default async function LoginPage(
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
            <h1 className="font-bold md:text-5xl md:text-left text-4xl text-center w-full mb-5">{langDict.login}</h1>

            <LoginForm/>
        </section>
    )

}