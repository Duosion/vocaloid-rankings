import { useEffect, useRef, useState } from "react"
import { Elevation, elevationToClass } from ".."
import { Icon } from "../material/icon"
import { MinimalIconButton } from "../material/minimal-icon-button"
import { FadeInOut } from "../transitions/fade-in-out"
import { FilterElement } from "./filter"
import { ToggleStatus } from "./types"

const stateIcons: { [key in ToggleStatus]: string } = {
    [ToggleStatus.INCLUDED]: 'select_check_box',
    [ToggleStatus.EXCLUDED]: 'indeterminate_check_box'
}

const stateTextStyles: { [key in ToggleStatus]: string } = {
    [ToggleStatus.INCLUDED]: 'font-semibold text-primary',
    [ToggleStatus.EXCLUDED]: 'line-through text-error'
}

export function MultiSelectFilterElement(
    {
        name,
        placeholder,
        included,
        excluded,
        options,
        searchable = false,
        icon = 'unfold_more',
        clearIcon = 'close',
        elevation = Elevation.LOW,
        modalElevation = Elevation.NORMAL,
        onValueChanged
    }: {
        name: string
        included: number[],
        excluded: number[],
        options: string[],
        placeholder: string
        searchable?: boolean
        minimal?: boolean
        icon?: string
        clearIcon?: string
        elevation?: Elevation
        modalElevation?: Elevation
        onValueChanged?: (included: number[], excluded: number[]) => void
    }
) {
    const [modalOpen, setModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [inputFocused, setInputFocused] = useState(false)

    // build the status map
    const statusMap: { [key: string]: ToggleStatus } = {}

    const includingNames: string[] = []
    const excludingNames: string[] = []

    included.forEach(option => {
        const name = options[option]
        includingNames.push(name)
        statusMap[name] = ToggleStatus.INCLUDED
    })
    excluded.forEach(option => {
        const name = options[option]
        excludingNames.push(name)
        statusMap[name] = ToggleStatus.EXCLUDED
    })

    const valueIsDefault = (included.length === 0) && (excluded.length === 0)

    const modalRef = useRef<HTMLUListElement>(null)

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setModalOpen(false)
            }
        }

        document.addEventListener('click', handleClick)
        return () => {
            document.removeEventListener('click', handleClick)
        }
    }, [modalOpen])

    function setValue(
        includedValues = included,
        excludedValues = excluded
    ) {
        if (onValueChanged) onValueChanged(includedValues, excludedValues)  // call on value changed
    }

    return (
        <FilterElement key={name} name={name}>
            <div
                className={`py-2 px-4 rounded-full text-on-surface flex text-base font-normal cursor-pointer`}
                style={{ backgroundColor: `var(--md-sys-color-${elevationToClass[elevation]})` }}
                onClick={event => {
                    if (!event.defaultPrevented) setModalOpen(true)
                }}
            >
                {searchable ? <input
                    type='search'
                    placeholder={placeholder}
                    onFocus={() => {
                        setSearchQuery('')
                        setInputFocused(true)
                        setModalOpen(true)
                    }}
                    onBlur={() => setInputFocused(false)}
                    onChange={(event) => {
                        setSearchQuery(event.currentTarget.value.toLowerCase())
                    }}
                    onClick={(event) => event.preventDefault()}
                    className={`cursor-text bg-transparent outline-none text-left w-32 flex-1 text-on-surface pr-3`}
                />
                    : <button
                        className={`bg-transparent outline-none cursor-pointer text-left w-32 block whitespace-nowrap gap-2 overflow-hidden flex-1 mr-3 text-ellipsis ${valueIsDefault ? 'text-on-surface-variant' : 'text-primary'}`}
                    >{valueIsDefault ? placeholder
                        : <ul>
                            {options.map((option, index) => {
                                const state = statusMap[option]
                                return state == undefined ? undefined : <h4 key={index} className={`inline ${state === ToggleStatus.EXCLUDED ? 'line-through' : ''}`}>{option}, </h4>
                            })}
                        </ul>
                        }
                    </button>
                }
                {valueIsDefault ? <Icon icon={icon} /> : <MinimalIconButton icon={clearIcon} onClick={event => { event.preventDefault(); setValue([], []) }} />}
            </div>
            <FadeInOut visible={modalOpen} className="z-10">
                <div className="relative min-w-fit w-full h-0">
                    <ul ref={modalRef} className="absolute top-2 min-w-fit w-full right-0 rounded-3xl shadow-md p-2 max-h-72 overflow-y-scroll overflow-x-clip"
                        style={{ backgroundColor: `var(--md-sys-color-${elevationToClass[modalElevation]})` }}
                    >
                        {options.map((option, index) => {
                            const state = statusMap[option]
                            return searchable && option.toLowerCase().match(searchQuery) || !searchable ? (
                                <li key={index}>
                                    <button
                                        key={index}
                                        className="w-full font-normal flex h-auto overflow-clip text-ellipsis px-4 p-2 rounded-full relative transition-colors hover:bg-surface-container-highest"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            switch (state) {
                                                case ToggleStatus.INCLUDED:
                                                    excluded.push(index)
                                                    included.splice(included.indexOf(index), 1)
                                                    break;
                                                case ToggleStatus.EXCLUDED:
                                                    e.preventDefault() // prevent default
                                                    excluded.splice(excluded.indexOf(index), 1)
                                                    break;
                                                default:
                                                    included.push(index)
                                            }
                                            setValue()
                                        }}>
                                        <h3 className={`flex-1 text-left ${stateTextStyles[state]}`}>{option}</h3>
                                        <Icon icon={stateIcons[state] || 'check_box_outline_blank'}></Icon>
                                    </button>
                                </li>
                            ) : null
                        })}
                    </ul>
                </div>
            </FadeInOut>
        </FilterElement>
    )

}