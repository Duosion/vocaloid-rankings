import { useEffect, useRef, useState } from "react"
import { FilterElement } from "./filter"
import { FadeInOut } from "../transitions/fade-in-out"
import { Elevation, elevationToClass } from ".."
import { MinimalIconButton } from "../material/minimal-icon-button"
import { Icon } from "../material/icon"

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

    // parse filter value
    const filterRef = useRef<HTMLButtonElement>(null)
    const modalRef = useRef<HTMLUListElement>(null)

    const valueIsDefault = value == defaultValue
    const valueName = options[value]

    function setValue(newValue: number) {
        onValueChanged?.(newValue);
        setSearchQuery('')
        setModalOpen(false)
    }

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (!modalRef.current?.contains(event.target as Node) && !filterRef.current?.contains(event.target as Node)) {
                setModalOpen(false);
                setSearchQuery('');
            }
        }
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    return (
        <FilterElement
            key={name}
            name={name}
            minimal={minimal}
        >
            <button
                ref={filterRef}
                className={minimal ? 'text-on-background py-1 w-fit flex justify-end items-center text-lg font-normal' : `py-2 px-4 rounded-full text-on-surface flex text-base font-normal`}
                style={{ backgroundColor: minimal ? undefined : `var(--md-sys-color-${elevationToClass[elevation]})` }}
                onClick={event => {
                    if (!event.defaultPrevented) setModalOpen(!modalOpen)
                }}
            >
                {searchable
                    ? <input
                        type='search'
                        onFocus={() => {
                            setSearchQuery('')
                            setModalOpen(true)
                        }}
                        onChange={(event) => { setSearchQuery(event.currentTarget.value.toLowerCase()) }}
                        onClick={(event) => event.preventDefault()}
                        placeholder={valueName}
                        value={searchQuery}
                        className={`cursor-text bg-transparent outline-none text-left flex-1 pr-3 ${valueIsDefault ? 'text-on-surface placeholder:text-on-surface-variant' : 'text-primary placeholder:text-primary font-semibold'} ${minimal ? 'w-fit' : 'w-32'}`}
                    />
                    : <h3
                        className={`bg-transparent outline-none cursor-pointer text-left w-fit flex gap-2 overflow-hidden flex-1 pr-3 ${valueIsDefault ? 'text-on-surface-variant' : `text-primary font-semibold`}`}
                    >
                        {valueName}
                    </h3>
                }
                {valueIsDefault
                    ? <Icon icon={icon}/>
                    : <MinimalIconButton icon={clearIcon} onClick={event => {
                        event.preventDefault()
                        setValue(defaultValue)
                    }} />
                }

            </ button>
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