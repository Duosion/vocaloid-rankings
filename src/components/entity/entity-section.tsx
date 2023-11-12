export function EntitySection(
    {
        children,
        title,
        titleSupporting
    }: {
        children: React.ReactNode,
        title: string,
        className?: string,
        titleSupporting?: React.ReactNode
    }
) {
    return <section className="flex flex-col">
        <section className="flex gap-5 md:items-end items-center mb-3">
            <h3 className='md:text-2xl text-xl font-bold'>{title}</h3>
            <div className="flex gap-5 flex-1 justify-end">{titleSupporting}</div>
        </section>
        {children}
    </section>
}