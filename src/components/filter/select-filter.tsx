import { useEffect, useRef, useState } from "react"
import { FilterElement } from "./filter"
import { FadeInOut } from "../transitions/fade-in-out"
import { Elevation, elevationToClass } from ".."
import { MinimalIconButton } from "../material/minimal-icon-button"

export function SelectFilterElement(
    {
        name,
        value,
        defaultValue,
        options,
        searchable = false,
        minimal = false,
        icon = 'unfold_more',
        clearIcon = 'close',
        elevation = Elevation.LOW,
        modalElevation = Elevation.NORMAL,
        onValueChanged
    }: {
        name: string
        value: number
        defaultValue: number
        options: string[]
        searchable?: boolean
        minimal?: boolean
        icon?: string
        clearIcon?: string
        elevation?: Elevation
        modalElevation?: Elevation
        onValueChanged?: (newValue: number) => void
    }
) {
    value = isNaN(value) ? defaultValue : value
    const [modalOpen, setModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [inputFocused, setInputFocused] = useState(false)

    // parse filter value
    const filterRef = useRef<HTMLDivElement>(null)
    const modalRef = useRef<HTMLUListElement>(null)

    const valueIsDefault = value == defaultValue
    const valueName = options[value]

    const setValue = (newValue: number) => {
        if (value != newValue && onValueChanged) {
            onValueChanged(newValue)
        }
        setModalOpen(false)
    }

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            const current = modalRef.current
            const target = event.target as Node
            if (current && !current.contains(target) && !filterRef.current?.contains(target)) {
                setModalOpen(false)
            }
        }

        document.addEventListener('click', handleClick)
        return () => {
            document.removeEventListener('click', handleClick)
        }
    }, [modalOpen])

    return (
        <FilterElement key={name} name={name} minimal={minimal}>
            <div ref={filterRef} className={minimal ? 'text-on-background py-1 w-fit flex justify-end items-center text-lg font-normal' : `py-2 px-4 rounded-full text-on-surface flex text-base font-normal`}
                style={{ backgroundColor: minimal ? undefined : `var(--md-sys-color-${elevationToClass[elevation]})` }}
            >
                {searchable
                    ? <input
                        type='search'
                        onFocus={() => {
                            setSearchQuery('')
                            setInputFocused(true)
                            setModalOpen(true)
                        }}
                        onBlur={() => setInputFocused(false)}
                        onChange={(event) => { setSearchQuery(event.currentTarget.value.toLowerCase()) }}
                        value={inputFocused ? searchQuery : valueName}
                        className={`cursor-text bg-transparent outline-none text-left flex-1 pr-3 ${valueIsDefault ? 'text-on-surface-variant' : 'text-primary font-semibold'} ${minimal ? 'w-fit' : 'w-32'}`}
                    />
                    : <button
                        className={`bg-transparent outline-none cursor-pointer text-left w-fit flex gap-2 overflow-hidden flex-1 pr-3 ${valueIsDefault ? 'text-on-surface-variant' : `text-primary font-semibold`}`}
                        onClick={_ => setModalOpen(true)}
                    >{valueName}</button>
                }
                {valueIsDefault
                    ? <MinimalIconButton icon={icon} onClick={_ => setModalOpen(!modalOpen)} />
                    : <MinimalIconButton icon={clearIcon} onClick={_ => setValue(defaultValue)} />
                }
            </div>
            <FadeInOut visible={modalOpen} className="z-10">
                <div className="relative min-w-fit w-full h-0">
                    <ul ref={modalRef} className="absolute top-2 min-w-[160px] w-full right-0 rounded-3xl shadow-md p-2 max-h-72 overflow-y-scroll overflow-x-clip"
                        style={{ backgroundColor: `var(--md-sys-color-${elevationToClass[modalElevation]})` }}
                    >
                        {options.map((value, index) => {
                            return searchable && value.toLowerCase().match(searchQuery) || !searchable ? (
                                <li key={index}>
                                    <button key={index} onClick={(e) => { e.preventDefault(); setValue(index); }} className="w-full font-normal h-auto overflow-clip text-ellipsis p-2 rounded-full relative transition-colors hover:bg-surface-container-highest">{value}</button>
                                </li>
                            ) : null
                        })}
                    </ul>
                </div>
            </FadeInOut>
        </FilterElement>
    )

}