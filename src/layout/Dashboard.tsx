import { type Session } from "next-auth";
import Sidebar from "~/components/Sidebar";

type DashboardProps = {
  session: Session | null;
  children: JSX.Element;
};

const Dashboard = ({ children, session }: DashboardProps) => {
  return (
    <main className="bg-mochaMantle flex h-screen w-full">
      <div className=" grid h-full w-full grid-cols-[256px_minmax(0,_1fr)] grid-rows-1 gap-2 p-2">
        <div className="flex h-full w-full flex-col">
          <div className="bg-mochaBase flex h-full w-full flex-col rounded-md p-4">
            <Sidebar session={session} />
          </div>
        </div>
        <div className="flex h-full w-full">
          <div className="flex h-full w-full flex-col gap-2 rounded-md">
            <div className="bg-mochaBase flex h-full w-full overflow-hidden rounded-md">
              {children}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
