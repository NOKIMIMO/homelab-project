const MissingPage = () => {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-6xl font-black tracking-tight">404</h1>
                <p className="text-xl opacity-50 mt-4">Oups, la page que vous cherchez n'existe pas.</p>
            </div>
        </div>
    );
}

export default MissingPage;