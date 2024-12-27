'use client'
const ComingSoon: React.FC = () => {
    const handleBack = () => {
        history.back();
    }
    return (
        <>
            <div className="flex flex-1 gap-10 flex-col items-center justify-center">
                <p className="text-7xl">Coming Soon</p>
                <button className="rounded-md bg-red-600 hover:bg-red-500 p-4" onClick={handleBack}>Back</button>
            </div>
        </>
    )
}

export default ComingSoon;