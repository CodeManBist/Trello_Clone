import { Link } from "react-router-dom";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-black">
      <Header />

      <main>
        <section className="px-5 pt-3 sm:pt-4">
          <div className="mx-auto flex max-w-6xl flex-col items-center text-center">

            {/* Hero Content */}
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
                Plan. Collaborate.
                <br />
                <span className="text-black">
                  Get work done together.
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-700 sm:text-lg">
                Create boards, manage issues, assign work, and
                collaborate with your team in real time.
              </p>
            </div>

            {/* Hero Image */}
            <div className="mt-5 sm:mt-5">
              <img
                src="/hero.png"
                alt="Taskly collaboration"
                className="mx-auto w-full max-w-[380px] object-contain sm:max-w-[460px] md:max-w-[540px]"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;