import { MouseEventHandler } from "react";
import { Icon } from "./icon";

export function FloatingActionButton(
    {
        icon,
        className = '',
        onClick
    }: {
        icon: string,
        className?: string
        onClick?: MouseEventHandler<HTMLButtonElement>
    }
) {
    return (
        <button
            className={`${className} w-14 h-14 fixed rounded-2xl right-4 bottom-4 bg-primary-container text-on-primary-container shadow-md flex items-center justify-center before:bg-on-primary-container before:absolute before:w-full before:h-full before:rounded-2xl before:opacity-0 hover:before:opacity-5 before:transition-opacity z-10`}
            onClick={onClick}
        >
            <Icon icon={icon} />
        </button>
    )
}