import { EntityNames } from "@/app/[lang]/rankings/types"
import { useSettings } from "@/components/providers/settings-provider"
import { FilterInclusionMode, Id } from "@/data/types"
import { buildEntityNames, graphClient } from "@/lib/api"
import { ApiSong } from "@/lib/api/types"
import { timeoutDebounce } from "@/lib/utils"
import { getEntityName } from "@/localization"
import { APIError, GraphQLResponseError, Result } from "graphql-hooks"
import { useEffect, useRef, useState } from "react"
import { Elevation, ImageDisplayMode, elevationToClass } from ".."
import { useLocale } from "../providers/language-dictionary-provider"
import { FadeInOut } from "../transitions/fade-in-out"
import { FilterElement } from "./filter"
import EntityThumbnail from "../entity-thumbnail"

const SONGS_SEARCH = `
query SongsSearch(
    $query: String!
    $excludeSongs: [Int]
) {
    searchSongs(
        query: $query
        maxEntries: 5
        excludeSongs: $excludeSongs
    ) {
        id
        thumbnail
        averageColor
        names {
            original
            japanese
            english
            romaji
        }
    }
}
`

export function SongSearchFilter(
    {
        name,
        value,
        placeholder,
        entityNames,
        elevation = Elevation.LOW,
        modalElevation = Elevation.NORMAL,
        onValueChanged,
        onEntityNamesChanged,
        onInclusionModeChanged,
    }: {
        name: string
        value: Id[]
        placeholder: string
        entityNames: EntityNames
        elevation?: Elevation
        modalElevation?: Elevation
        onValueChanged?: (newValue: Id[]) => void
        onEntityNamesChanged?: (newValue: EntityNames) => void
        onInclusionModeChanged?: (newValue?: FilterInclusionMode) => void
    }
) {
    // get langDict
    const langDict = useLocale()

    // react states
    const [modalOpen, setModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [inputFocused, setInputFocused] = useState(false)

    // react refs
    const modalRef = useRef<HTMLUListElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout>()

    // graphql context
    const [loading, setLoading] = useState(false)
    const [apiError, setApiError] = useState(null as APIError<GraphQLResponseError> | null)
    const [apiData, setApiData] = useState(null as any)

    const searchResult = apiData?.searchSongs as ApiSong[]

    // settings
    const { settings } = useSettings()

    // import settings
    const settingTitleLanguage = settings.titleLanguage

    function addSong(newSongId: Id) {
        value.push(newSongId)
        if (onValueChanged) {
            onValueChanged(value)
        }
    }

    const onInputChanged = (input: string) => {
        setSearchQuery(input)
        if (!modalOpen) {
            setModalOpen(true)
        }
        timeoutDebounce(timeoutRef, 500, () => {
            setLoading(true)
            setApiError(null)

            graphClient.request({
                query: SONGS_SEARCH,
                variables: {
                    query: input,
                    excludeSongs: value
                }
            }).then((result: Result<any, any>) => {
                const error = result.error
                if (error) {
                    setApiError(error)
                }
                setApiData(result.data)
            })
                .catch(_ => { })
                .finally(() => setLoading(false))
        })
    }

    // close the modal when clicked outside of it
    useEffect(() => {
        function handleClick(event: MouseEvent) {
            const current = modalRef.current
            if (current && !current.contains(event.target as Node)) {
                setModalOpen(false)
            }
        }

        document.addEventListener('click', handleClick)
        return () => {
            document.removeEventListener('click', handleClick)
        }
    }, [modalOpen])

    return (
        <FilterElement
            key={name}
            name={name}
        >
            <div className='py-2 px-4 rounded-full text-on-surface flex text-base font-normal'
                style={{ backgroundColor: `var(--md-sys-color-${elevationToClass[elevation]})` }}
            >
                <input
                    type='search'
                    onFocus={() => {
                        setSearchQuery('')
                        setInputFocused(true)
                    }}
                    onBlur={() => setInputFocused(false)}
                    onInput={(event) => onInputChanged(event.currentTarget.value)}
                    value={inputFocused ? searchQuery : undefined}
                    placeholder={placeholder}
                    className='cursor-text bg-transparent outline-none text-left flex-1 pr-3 text-on-surface'
                />
            </div>
            {/* pop-up search box */}
            <FadeInOut visible={modalOpen} className="z-10">
                <div className="relative min-w-fit w-full h-0">
                    <ul ref={modalRef} className="absolute top-2 min-w-[160px] w-full right-0 rounded-3xl shadow-md p-2 max-h-72 overflow-y-scroll overflow-x-clip"
                        style={{ backgroundColor: `var(--md-sys-color-${elevationToClass[modalElevation]})` }}
                    >
                        {apiError || !searchResult ? <h3 className="text-base text-center">{''}</h3>
                            : loading ? <h3 className="text-base text-center"></h3>
                                : searchResult.map(result => {
                                    const name = getEntityName(buildEntityNames(result.names), settingTitleLanguage)
                                    const id = result.id
                                    return (
                                        <button
                                            key={id}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                addSong(id)
                                                // add name to names
                                                entityNames[id] = name
                                                if (onEntityNamesChanged) onEntityNamesChanged(entityNames);
                                                // close modal
                                                setModalOpen(false)
                                            }}
                                            className="w-full font-normal flex gap-3 items-center h-auto text-left overflow-clip text-ellipsis p-2 rounded-full relative transition-colors hover:bg-surface-container-highest"
                                        >
                                            <EntityThumbnail
                                                    src={result.thumbnail}
                                                    alt={name}
                                                    width={25}
                                                    height={25}
                                                    imageDisplayMode={ImageDisplayMode.SONG}
                                                    fillColor={result.averageColor}
                                                />
                                            {name}
                                        </button>
                                    )
                                })

                        }
                    </ul>
                </div>
            </FadeInOut>
        </FilterElement>
    )
}