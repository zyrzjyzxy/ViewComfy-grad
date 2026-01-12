export function Header({ title, icon, children }: { title: string, icon?: React.ReactNode, children?: React.ReactNode }) {
    return (
        <header className="sticky top-0 z-10 flex h-[53px] items-center gap-2 bg-background px-4">
            <h1 className="text-xl font-semibold flex items-center gap-2">
                {icon}
                {title}
            </h1>
            {children}
        </header>
    )
}
