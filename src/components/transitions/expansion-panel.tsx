import { timeoutDebounce } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { Icon } from "../material/icon"

export function ExpansionPanel(
    {
        label,
        visible = false,
        duration = 150,
        children
    }: {
        label: string
        visible?: boolean
        duration?: number
        children?: React.ReactNode
    }
) {
    const [isVisible, setIsVisible] = useState(visible)

    return (
        <section>
            <button className="w-full flex gap-2 items-center h-fit" onClick={_ => {setIsVisible(!isVisible)}}>
                <Icon icon={isVisible ? 'expand_more' : 'chevron_right'}/>
                <h3 className="text-on-background font-semibold text-lg">{label}</h3>
            </button>
            <div
                className="w-full flex flex-col gap-5"
                style={{
                    maxHeight: isVisible ? 'fit-content' : '0px',
                    marginTop: isVisible ? '8px' : undefined,
                }}
            >
                {isVisible ? children : undefined}
            </div>
        </section>

    )

}