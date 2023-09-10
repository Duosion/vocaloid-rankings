import { useEffect, useRef, useState } from "react"
import { Icon } from "../material/icon"
import { FilterElement } from "./filter"
import { FadeInOut } from "../transitions/fade-in-out"

export function SelectFilterElement(
    {
        name,
        value,
        defaultValue,
        options,
        searchable = false,
        minimal = false,
        icon = 'expand_more',
        clearIcon = 'close',
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
        onValueChanged?: (newValue: number) => void
    }
) {
    value = isNaN(value) ? defaultValue : value
    const [modalOpen, setModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [inputFocused, setInputFocused] = useState(false)

    // parse filter value

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
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
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
            <search className={minimal ? 'text-on-background py-1 gap-3 w-fit flex justify-end items-center text-lg font-normal cursor-pointer' : "py-2 px-4 rounded-xl bg-surface-container-low text-on-surface flex gap-3 text-base font-normal cursor-pointer"} onClick={() => setModalOpen(true)}>
                {searchable
                    ? <input type='search' onFocus={() => { setSearchQuery(''); setInputFocused(true) }} onBlur={() => setInputFocused(false)} onChange={(event) => { setSearchQuery(event.currentTarget.value.toLowerCase()) }} value={inputFocused ? searchQuery : valueName} className={`cursor-text bg-transparent outline-none text-left ${valueIsDefault ? 'text-on-surface-variant' : 'text-primary'} ${minimal ? 'w-fit' : 'w-32'}`} />
                    : <span className={`bg-transparent outline-none cursor-pointer text-left ${valueIsDefault ? 'text-on-surface-variant' : 'text-primary'} ${minimal ? 'w-fit' : 'w-32'}`}>{valueName}</span>
                }
                {valueIsDefault ? <Icon icon={icon}></Icon> : <Icon icon={clearIcon}></Icon>}
            </search>
            <FadeInOut visible={modalOpen}>
                <div className="relative min-w-fit w-full h-0 z-20">
                    <ul ref={modalRef} className="absolute top-2 min-w-[160px] w-full right-0 rounded-xl bg-surface-container-high shadow-md p-2 max-h-72 overflow-y-scroll overflow-x-clip ">
                        {options.map((value, index) => {
                            return searchable && value.toLowerCase().match(searchQuery) || !searchable ? (
                                <li key={index}>
                                    <button key={index} onClick={(e) => { e.preventDefault(); setValue(index); }} className="w-full font-normal h-auto overflow-clip text-ellipsis p-2 rounded-xl relative transition-colors hover:bg-surface-container-highest">{value}</button>
                                </li>
                            ) : null
                        })}
                    </ul>
                </div>
            </FadeInOut>
        </FilterElement>
    )

}