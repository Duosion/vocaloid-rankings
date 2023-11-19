import { MouseEventHandler } from "react"
import { Icon } from "../material/icon"
import { IconButton } from "../material/icon-button"

export function RankingsPageSelector(
    {
        currentOffset = 0,
        totalCount = 0,
        surroundingPageCount = 1,
        pageSize = 50,
        onOffsetChanged
    }: {
        currentOffset?: number
        totalCount?: number
        surroundingPageCount?: number
        pageSize?: number
        onOffsetChanged?: (newOffset: number) => void
    }
) {

    const currentPage = Math.floor((isNaN(currentOffset) ? 0 : currentOffset) / pageSize)
    const totalPages = Math.ceil(totalCount / pageSize)

    const setPage = (newPage: number) => {
        if (onOffsetChanged) onOffsetChanged(newPage * pageSize)
    }

    const elements: React.ReactNode[] = []
    for (let i = Math.max(0, currentPage - surroundingPageCount); i < Math.min(totalPages, currentPage + surroundingPageCount + 1); i++) {
        elements.push(
            <PageSelectorItem
                text={(i + 1).toString()}
                active={i === currentPage}
                onClick={() => setPage(i)}
            />
        )
    }

    return (
        <ul className="w-full flex items-center justify-center gap-3">
            {currentPage > 0 ? <IconButton icon='arrow_back' onClick={() => setPage(currentPage - 1)}/> : undefined}
            {currentPage > surroundingPageCount ? <>
                <PageSelectorItem text='1' onClick={() => setPage(0)} />
                <Icon icon='more_horiz' />
            </> : undefined}
            {elements}
            {/* Jump to Last Page */}
            {(totalPages - (surroundingPageCount + 1)) > currentPage ? <>
                <Icon icon='more_horiz' />
                <PageSelectorItem text={totalPages.toString()} onClick={() => setPage(totalPages - 1)} />
            </> : undefined}
            {totalPages > currentPage ? <IconButton icon='arrow_forward' onClick={() => setPage(currentPage + 1)}/> : undefined}
        </ul>
    )

}

function PageSelectorItem(
    {
        text,
        active,
        onClick
    }: {
        text: string,
        active?: boolean,
        onClick?: MouseEventHandler
    }
) {
    return (
        <button className={`h-10 min-w-10 px-4 flex items-center justify-center text-lg rounded-full transition-colors ${active ? 'text-on-secondary-container bg-secondary-container' : 'text-on-background hover:bg-surface-container-lowest'}`} onClick={onClick}>{text}</button>
    )
}