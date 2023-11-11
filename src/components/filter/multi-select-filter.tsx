import { useEffect, useRef, useState } from "react"
import { Icon } from "../material/icon"
import { FilterElement } from "./filter"
import { FadeInOut } from "../transitions/fade-in-out"
import { Elevation, elevationToClass } from ".."
import { MinimalIconButton } from "../material/minimal-icon-button"

function ActiveValue(
    {
        name,
        onClick
    }: {
        name: string,
        onClick?: () => void
    }
) {
    return (
        <button className="px-3 rounded-lg text-sm text-on-surface border border-on-background box-border whitespace-nowrap" onClick={_ => {
            if (onClick) {
                onClick()
            }
        }}>{name}</button>
    )
}

export function MultiSelectFilterElement(
    {
        name,
        value,
        options,
        placeholder,
        searchable = false,
        icon = 'expand_more',
        clearIcon = 'close',
        elevation = Elevation.LOW,
        modalElevation = Elevation.NORMAL,
        onValueChanged
    }: {
        name: string
        value: number[]
        options: string[]
        placeholder: string
        searchable?: boolean
        minimal?: boolean
        icon?: string
        clearIcon?: string
        elevation?: Elevation
        modalElevation?: Elevation
        onValueChanged?: (newValue: number[]) => void
    }
) {
    const [modalOpen, setModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [inputFocused, setInputFocused] = useState(false)

    // parse filter value
    const valuesCount = value.length
    const modalRef = useRef<HTMLUListElement>(null)

    const valueIsDefault = 0 >= valuesCount

    const setValue = (newValue: number[]) => {
        if (onValueChanged) {
            onValueChanged(newValue)
        }
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

    const activeValues: JSX.Element[] = []
    if (!valueIsDefault) {
        activeValues.push(<ActiveValue name={options[value[0]]} onClick={() => {
            value.splice(0, 1)
            setValue(value)
        }} />)
        if (valuesCount > 1) {
            activeValues.push(<ActiveValue name={`+${valuesCount - 1}`}></ActiveValue>)
        }
    }

    return (
        <FilterElement key={name} name={name}>
            <div className={`py-2 px-4 rounded-xl text-on-surface flex text-base font-normal`}
                style={{ backgroundColor: `var(--md-sys-color-${elevationToClass[elevation]})` }}
            >
                {!valueIsDefault && !searchable ? <ul className="flex-1 flex gap-3 mr-3">{activeValues}</ul> : undefined}
                {searchable ? <input
                        type='search'
                        placeholder={placeholder}
                        onFocus={() => {
                            setSearchQuery('')
                            setInputFocused(true)
                        }}
                        onBlur={() => setInputFocused(false)}
                        onChange={(event) => {
                            setSearchQuery(event.currentTarget.value.toLowerCase())
                        }}
                        onClick={_ => setModalOpen(true)}
                        value={inputFocused ? searchQuery : ''}
                        className={`cursor-text bg-transparent outline-none text-left w-32 flex-1 text-on-surface pr-3`}
                    />
                    : valueIsDefault ? <button
                        className={`bg-transparent outline-none cursor-pointer text-left w-32 flex gap-2 overflow-hidden flex-1 pr-3 ${valueIsDefault ? 'text-on-surface-variant' : 'text-primary'}`}
                        onClick={_ => setModalOpen(true)}
                    >{placeholder}</button> : undefined
                }
                {valueIsDefault ? <MinimalIconButton icon={icon} onClick={_ => setModalOpen(!modalOpen)} /> : <MinimalIconButton icon={clearIcon} onClick={_ => setValue([])} />}
            </div>
            <FadeInOut visible={modalOpen} className="z-10">
                <div className="relative min-w-fit w-full h-0">
                    <ul ref={modalRef} className="absolute top-2 min-w-fit w-full right-0 rounded-xl shadow-md p-2 max-h-72 overflow-y-scroll overflow-x-clip"
                        style={{ backgroundColor: `var(--md-sys-color-${elevationToClass[modalElevation]})` }}
                    >
                        {options.map((option, index) => {
                            const selectedIndex = value.indexOf(index)
                            const isSelected = selectedIndex != -1
                            return searchable && option.toLowerCase().match(searchQuery) || !searchable ? (
                                <li key={index}>
                                    <button key={index} className="flex w-full font-normal h-auto p-2 rounded-xl relative transition-colors hover:bg-surface-container-highest" onClick={(e) => {
                                        e.preventDefault()
                                        if (isSelected) {
                                            value.splice(selectedIndex, 1)
                                        } else {
                                            value.push(index)
                                        }
                                        setValue(value)
                                    }}>
                                        <h3 className="flex-1 text-left">{option}</h3>
                                        {isSelected && <Icon icon='check_circle' />}
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