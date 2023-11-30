import { FullFilterElement } from "./full-filter"
import { MinimalFilterElement } from "./minimal-filter"

export function FilterElement(
    {
        name,
        nameTrailing,
        minimal = false,
        children,
        className = ''
    }: {
        name: string,
        nameTrailing?: React.ReactNode
        minimal?: boolean
        children?: React.ReactNode
        shrink?: boolean
        className?: string
    }
) {
    return minimal ? <MinimalFilterElement name={name} className={className}>{children}</MinimalFilterElement>
        : <FullFilterElement name={name} nameTrailing={nameTrailing} className={className}>{children}</FullFilterElement>
}