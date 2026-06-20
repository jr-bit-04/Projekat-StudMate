import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import CitaonaLocationTracker from "../citaona/CitaonaLocationTracker";

import loginBg from "../../assets/background.png";

function MainLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#071f4f] pb-24 lg:pb-0">
      <CitaonaLocationTracker />

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(75,150,255,0.34),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(56,189,248,0.18),transparent_24%),linear-gradient(180deg,#0a2b6f_0%,#06173d_100%)]" />

      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-55"
        style={{
          backgroundImage: `url(${loginBg})`,
        }}
      />

      <div className="studmate-float-slow fixed -left-16 top-20 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl" />
      <div className="studmate-drift fixed bottom-[-3rem] right-[8%] h-80 w-80 rounded-full bg-blue-300/14 blur-3xl" />
      <div className="fixed inset-0 studmate-grid-overlay opacity-40" />
      <div className="fixed inset-0 bg-[#081f55]/36 backdrop-blur-[6px]" />
      <div className="fixed inset-0 studmate-noise" />

      <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-[1700px]">
        <Sidebar />

        <main className="w-full min-w-0 flex-1 px-3 py-4 sm:px-4 md:px-8 md:py-7">
          {children}
        </main>

        <MobileNav />
      </div>
    </div>
  );
}

export default MainLayout;
