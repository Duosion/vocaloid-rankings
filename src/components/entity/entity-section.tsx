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
    return <section>
        <section className="flex gap-5 items-center mb-2">
            <h3 className='text-xl font-bold'>{title}</h3>
            <div className="flex gap-5 flex-1 justify-end">{titleSupporting}</div>
        </section>
        {children}
    </section>
}