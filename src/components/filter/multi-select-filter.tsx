import { useEffect, useRef, useState } from "react"
import { Elevation, elevationToClass } from ".."
import { Icon } from "../material/icon"
import { MinimalIconButton } from "../material/minimal-icon-button"
import { FadeInOut } from "../transitions/fade-in-out"
import { FilterElement } from "./filter"
import { ToggleStatus } from "./types"
import { useLocale } from "../providers/language-dictionary-provider"
import { FilterInclusionMode } from "@/data/types"

const stateIcons: { [key in ToggleStatus]: string } = {
    [ToggleStatus.INCLUDED]: 'select_check_box',
    [ToggleStatus.EXCLUDED]: 'indeterminate_check_box'
}

const stateTextStyles: { [key in ToggleStatus]: string } = {
    [ToggleStatus.INCLUDED]: 'font-semibold text-primary',
    [ToggleStatus.EXCLUDED]: 'line-through text-error'
}

function createStatusMap(
    included: number[],
    excluded: number[],
    options: string[]
): {
    statusMap: Record<string, ToggleStatus>,
    includingNames: string[],
    excludingNames: string[]
} {
    const statusMap: Record<string, ToggleStatus> = {};
    const includingNames: string[] = [];
    const excludingNames: string[] = [];

    included.forEach((option) => {
        const name = options[option];
        includingNames.push(name);
        statusMap[name] = ToggleStatus.INCLUDED;
    });

    excluded.forEach((option) => {
        const name = options[option];
        excludingNames.push(name);
        statusMap[name] = ToggleStatus.EXCLUDED;
    });

    return { statusMap, includingNames, excludingNames };
}

export function MultiSelectFilterElement(
    {
        name,
        included,
        excluded,
        options,
        placeholder,
        defaultInclusionMode,
        inclusionMode,
        searchable = false,
        icon = 'unfold_more',
        clearIcon = 'close',
        elevation = Elevation.LOW,
        modalElevation = Elevation.NORMAL,
        onValueChanged,
        onInclusionModeChanged
    }: {
        name: string
        included: number[],
        excluded: number[],
        options: string[],
        placeholder: string
        defaultInclusionMode?: number
        inclusionMode?: number
        searchable?: boolean
        minimal?: boolean
        icon?: string
        clearIcon?: string
        elevation?: Elevation
        modalElevation?: Elevation
        onValueChanged?: (included: number[], excluded: number[]) => void
        onInclusionModeChanged?: (newValue?: FilterInclusionMode) => void
    }
) {
    const [modalOpen, setModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const langDict = useLocale(); // import langdict

    //refs
    const modalRef = useRef<HTMLUListElement>(null)
    const filterRef = useRef<HTMLDivElement>(null)

    const { statusMap, includingNames, excludingNames } = createStatusMap(included, excluded, options);

    // build value names
    const includingName = includingNames.length > 0 ? langDict['filter_multi_include'].replace(':options', includingNames.join(langDict['filter_multi_separator'])) : null;
    const excludingName = excludingNames.length > 0 ? langDict['filter_multi_exclude'].replace(':options', excludingNames.join(langDict['filter_multi_separator'])) : null;
    const valueName = includingName && excludingName ? langDict['filter_multi_joiner'].replace(':include', includingName).replace(':exclude', excludingName) : includingName || excludingName || '';

    const valueIsDefault = included.length === 0 && excluded.length === 0

    // inclusion mode stuff
    inclusionMode = inclusionMode == undefined || isNaN(inclusionMode) ? defaultInclusionMode : inclusionMode
    const inclusionModeIsAnd = inclusionMode == FilterInclusionMode.AND

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

    function setValue(includedValues = included, excludedValues = excluded) {
        onValueChanged?.(includedValues, excludedValues);
    }

    function handleOptionClick(optionIndex: number, currentState: ToggleStatus | undefined) {
        switch (currentState) {
            case ToggleStatus.INCLUDED:
                excluded.push(optionIndex);
                included.splice(included.indexOf(optionIndex), 1);
                break;
            case ToggleStatus.EXCLUDED:
                excluded.splice(excluded.indexOf(optionIndex), 1);
                break;
            default:
                included.push(optionIndex);
        }
        setValue([...included], [...excluded]);
    }

    return (
        <FilterElement
            key={name}
            name={name}
            nameTrailing={
                inclusionMode == undefined ? undefined
                    : <button
                        className={`rounded-full text-base px-4${inclusionModeIsAnd ? ' outline outline-1 border-outline-variant text-on-surface-variant' : ' outline outline-1 border-primary bg-primary text-on-primary'}`}
                        onClick={() => {
                            onInclusionModeChanged?.(inclusionModeIsAnd ? FilterInclusionMode.OR : FilterInclusionMode.AND)
                        }}
                    >
                        {inclusionModeIsAnd ? langDict['filter_inclusion_mode_and'] : langDict['filter_inclusion_mode_or']}
                    </button>
            }
        >
            <div
                ref={filterRef}
                className={`py-2 px-4 rounded-full text-on-surface flex text-base font-normal cursor-pointer`}
                style={{ backgroundColor: `var(--md-sys-color-${elevationToClass[elevation]})` }}
                onClick={event => {
                    if (!event.defaultPrevented) setModalOpen(!modalOpen)
                }}
            >
                {searchable ? <input
                    type='search'
                    placeholder={valueIsDefault ? placeholder : valueName}
                    value={searchQuery}
                    onFocus={() => {
                        setSearchQuery('')
                        setModalOpen(true)
                    }}
                    onChange={(event) => {
                        setSearchQuery(event.currentTarget.value.toLowerCase())
                    }}
                    onClick={(event) => event.preventDefault()}
                    className={`cursor-text bg-transparent outline-none text-left w-32 flex-1 pr-3`}
                />
                    : <h3
                        className={`bg-transparent outline-none cursor-pointer text-left w-32 block whitespace-nowrap gap-2 overflow-hidden flex-1 mr-3 text-ellipsis ${valueIsDefault ? 'text-on-surface-variant' : 'text-primary'}`}
                    >
                        {valueIsDefault ? placeholder : valueName}
                    </h3>
                }
                {valueIsDefault ? <Icon icon={icon} /> : <MinimalIconButton icon={clearIcon} onClick={event => { event.preventDefault(); setValue([], []) }} />}
            </div>
            <FadeInOut visible={modalOpen} className="z-10">
                <div className="relative min-w-fit w-full h-0">
                    <ul
                        ref={modalRef}
                        className="absolute top-2 min-w-fit w-full right-0 rounded-3xl shadow-md p-2 max-h-72 overflow-y-scroll overflow-x-clip"
                        style={{ backgroundColor: `var(--md-sys-color-${elevationToClass[modalElevation]})` }}
                    >
                        {options.map((option, index) => {
                            const state = statusMap[option]
                            return (!searchable || option.toLowerCase().includes(searchQuery)) && (
                                <li key={index} className="w-full">
                                    <button
                                        className="w-full font-normal flex h-auto overflow-clip text-ellipsis px-4 p-2 rounded-full relative transition-colors hover:bg-surface-container-highest"
                                        onClick={() => handleOptionClick(index, state)}
                                    >
                                        <h3 className={`flex-1 text-left ${stateTextStyles[state]}`}>{option}</h3>
                                        <Icon icon={stateIcons[state] || 'check_box_outline_blank'} />
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </FadeInOut>
        </FilterElement>
    )

}