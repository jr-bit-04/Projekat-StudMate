import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

import loginBg from "../../assets/background.png";

function MainLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0b3a8f] pb-24 lg:pb-0">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${loginBg})`,
        }}
      />

      <div className="fixed inset-0 bg-[#0b3a8f]/15 backdrop-blur-[2px]" />

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
