import Sidebar from "~/components/Sidebar";

type DashboardProps = {
    children: JSX.Element
}

const Dashboard = ({ children }: DashboardProps) => {
    return (
        <div className="flex w-full h-screen bg-whiteLigth">
            <div className=" grid grid-cols-[256px_minmax(0,_1fr)] grid-rows-1 gap-2 p-2 w-full h-full">
                <div className="w-full h-full flex flex-col">
                    <div className="w-full h-full rounded-md p-4 flex flex-col bg-whiteMain">
                        <Sidebar />
                    </div>
                </div>
                <div className="flex w-full h-full">
                    <div className="w-full h-full rounded-md gap-2 flex flex-col">
                        <div className="flex w-full h-full overflow-hidden bg-whiteMain rounded-md">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;