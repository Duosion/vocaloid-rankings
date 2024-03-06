'use client'
import { InputFilterElement } from "@/components/filter/input-filter";
import Image from "@/components/image";
import { Divider } from "@/components/material/divider";
import { FilledButton } from "@/components/material/filled-button";
import { Icon } from "@/components/material/icon";
import { useLocale } from "@/components/providers/language-dictionary-provider";
import { Id, List, ListLocalizations } from "@/data/types";
import { Locale } from "@/localization";
import { LangLocaleTokens } from "@/localization/DictionaryTokenMaps";
import { useState } from "react";

interface ListValues {
    id: Id | null;
    songIds: Id[];
    names: ListLocalizations;
    descriptions: ListLocalizations;
    image: string | null;
}

export function ListEditor(
    {
        list
    }: {
        list?: List
    }
) {
    const [listValues, setListValues] = useState({
        id: list?.id || null,
        songIds: list?.songIds || [] as Id[],
        names: list?.names || {} as ListLocalizations,
        descriptions: list?.names || {} as ListLocalizations,
        image: list?.image || null
    } as ListValues)

    const langDict = useLocale()

    const saveListValues = (
        newValues: ListValues
    ) => {
        setListValues({ ...newValues })
    }

    const nameElements: React.ReactNode[] = []
    const descElements: React.ReactNode[] = []

    for (const locale in LangLocaleTokens) {
        const localizedName = langDict[LangLocaleTokens[locale as Locale]]
        // create name element row
        nameElements.push((
            <tr>
                <td className="font-normal text-xl w-fit pr-5 pb-5">{localizedName}</td>
                <td className="pb-5"><InputFilterElement
                    type='text'
                    value={listValues.names[locale as Locale] || ''}
                    placeholder={langDict.list_names_placeholder}
                    defaultValue=""
                    onValueChanged={(newValue) => {
                        listValues.names[locale as Locale] = newValue
                        saveListValues(listValues)
                    }}
                /></td>
            </tr>
        ))
        // create description element row
        descElements.push((
            <tr>
                <td className="font-normal text-xl w-fit pr-5 pb-5">{localizedName}</td>
                <td className="pb-5"><InputFilterElement
                    type='text'
                    value={listValues.descriptions[locale as Locale] || ''}
                    placeholder={langDict.list_descriptions_placeholder}
                    defaultValue=""
                    onValueChanged={(newValue) => {
                        listValues.descriptions[locale as Locale] = newValue
                        saveListValues(listValues)
                    }}
                /></td>
            </tr>
        ))
    }

    return (
        <article className="flex flex-col gap-5 w-full min-h-screen">
            <section className="w-full flex gap-5 items-end">
                <h1 className="font-bold md:text-5xl md:text-left text-4xl flex-1">{langDict.list_create_title}</h1>
                <FilledButton text={langDict.list_save} />
            </section>

            <Divider />

            {/* image */}
            <h2 className="font-semibold text-3xl">{langDict.list_image_title}</h2>
            <section className="flex flex-col gap-3 w-fit">
                <figure className="w-full aspect-square max-w-64 rounded-3xl bg-surface-container-low flex items-center justify-center">
                    {listValues.image ? <Image
                        className="w-full h-full object-cover rounded-3xl"
                        src={listValues.image}
                        alt={langDict.list_image_title}
                    /> : <Icon className=" text-surface-variant" icon='image' />}
                </figure>
                <InputFilterElement
                    type='url'
                    value={listValues.image || ''}
                    placeholder={langDict.list_image_title}
                    defaultValue=""
                    onValueChanged={(newImage) => {
                        listValues.image = newImage
                        saveListValues(listValues)
                    }}
                />
            </section>

            <Divider />

            {/* names */}
            <section className="flex flex-col gap-2">
                <h2 className="font-semibold text-3xl">{langDict.list_names_title}</h2>
                <h3 className="text-base text-error">{langDict.list_names_required}</h3>
            </section>
            <table className="table-cell"><tbody>{nameElements}</tbody></table>

            <Divider />

            {/* descriptions */}
            <section className="flex flex-col gap-2">
                <h2 className="font-semibold text-3xl">{langDict.list_descriptions_title}</h2>
                <h3 className="text-base text-error">{langDict.list_descriptions_required}</h3>
            </section>
            <table className="table-cell"><tbody>{descElements}</tbody></table>

            <Divider />

            {/* songs */}
            <section className="flex gap-5 items-end ">
                <h2 className="font-semibold text-3xl flex-1 h-fit">{langDict.list_songs_title}</h2>
            </section>
        </article>

    )

}