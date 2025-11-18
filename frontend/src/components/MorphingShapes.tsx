import { useEffect, useRef } from "react";

interface MorphingShapesProps {
  className?: string;
  transitionDuration?: number;
  changeInterval?: number;
}

const MorphingShapes = ({
  className = "",
  transitionDuration = 750,
  changeInterval = 3000,
}: MorphingShapesProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const rand = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1) + min);

    const uniqueRand = (min: number, max: number, prev: number) => {
      let next = prev;
      while (prev === next) next = rand(min, max);
      return next;
    };

    const combinations = [
      { configuration: 1, roundness: 1 },
      { configuration: 1, roundness: 2 },
      { configuration: 1, roundness: 4 },
      { configuration: 2, roundness: 2 },
      { configuration: 2, roundness: 3 },
      { configuration: 3, roundness: 3 },
    ];

    let prev = 0;

    const updateConfiguration = () => {
      const index = uniqueRand(0, combinations.length - 1, prev);
      const combination = combinations[index];

      wrapper.dataset.configuration = combination.configuration.toString();
      wrapper.dataset.roundness = combination.roundness.toString();

      prev = index;
    };

    // Set initial configuration
    updateConfiguration();

    // Set up interval
    intervalRef.current = setInterval(updateConfiguration, changeInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [changeInterval]);

  return (
    <>
      <style>{`
        #morphing-shapes-wrapper {
          aspect-ratio: 1.618;
          width: 90vmin;
          position: relative;
        }

        #morphing-shapes-wrapper > .shape {
          height: 30%;
          width: 30%;
          background-color: rgba(255, 255, 255, 0.05);
          position: absolute;
          transition: left ${transitionDuration}ms ease-in-out,
                      top ${transitionDuration}ms ease-in-out,
                      height ${transitionDuration}ms ease-in-out,
                      width ${transitionDuration}ms ease-in-out,
                      border-radius ${transitionDuration}ms ease-in-out;
        }

        #morphing-shapes-wrapper > .shape:nth-child(1) {
          background-color: rgb(176, 190, 197);
          z-index: 2;
        }

        #morphing-shapes-wrapper > .shape:nth-child(2) {
          background-color: rgb(245, 245, 245);
          z-index: 2;
        }

        #morphing-shapes-wrapper > .shape:nth-child(3) {
          background-color: rgb(155, 93, 229);
          z-index: 1;
        }

        #morphing-shapes-wrapper > .shape:nth-child(4) {
          background-color: rgb(241, 91, 181);
          z-index: 2;
        }

        #morphing-shapes-wrapper > .shape:nth-child(5) {
          background-color: rgb(254, 228, 64);
          z-index: 2;
        }

        #morphing-shapes-wrapper > .shape:nth-child(6) {
          background-color: rgb(0, 187, 249);
          z-index: 2;
        }

        #morphing-shapes-wrapper > .shape:nth-child(7) {
          background-color: rgb(0, 245, 212);
          z-index: 2;
        }

        #morphing-shapes-wrapper[data-configuration="1"] > .shape:nth-child(1) {
          left: 0%;
          top: 0%;
          height: 50%;
          width: 20%;
        }

        #morphing-shapes-wrapper[data-configuration="1"] > .shape:nth-child(2) {
          left: 20%;
          top: 0%;
          height: 50%;
          width: 30%;
        }

        #morphing-shapes-wrapper[data-configuration="1"] > .shape:nth-child(3) {
          left: 50%;
          top: 0%;
          height: 100%;
          width: 50%;
        }

        #morphing-shapes-wrapper[data-configuration="1"] > .shape:nth-child(4) {
          left: 0%;
          top: 50%;
          height: 50%;
          width: 30%;
        }

        #morphing-shapes-wrapper[data-configuration="1"] > .shape:nth-child(5) {
          left: 30%;
          top: 50%;
          height: 50%;
          width: 20%;
        }

        #morphing-shapes-wrapper[data-configuration="1"] > .shape:nth-child(6) {
          left: 70%;
          top: 50%;
          height: 50%;
          width: 30%;
        }

        #morphing-shapes-wrapper[data-configuration="1"] > .shape:nth-child(7) {
          left: 85%;
          top: 75%;
          height: 25%;
          width: 15%;
        }

        #morphing-shapes-wrapper[data-configuration="2"] > .shape:nth-child(1) {
          left: 25%;
          top: 20%;
          height: 80%;
          width: 15%;
        }

        #morphing-shapes-wrapper[data-configuration="2"] > .shape:nth-child(2) {
          left: 40%;
          top: 20%;
          height: 50%;
          width: 10%;
        }

        #morphing-shapes-wrapper[data-configuration="2"] > .shape:nth-child(3) {
          left: 50%;
          top: 0%;
          height: 100%;
          width: 25%;
        }

        #morphing-shapes-wrapper[data-configuration="2"] > .shape:nth-child(4) {
          left: 0%;
          top: 0%;
          height: 50%;
          width: 10%;
        }

        #morphing-shapes-wrapper[data-configuration="2"] > .shape:nth-child(5) {
          left: 10%;
          top: 0%;
          height: 70%;
          width: 15%;
        }

        #morphing-shapes-wrapper[data-configuration="2"] > .shape:nth-child(6) {
          left: 75%;
          top: 10%;
          height: 80%;
          width: 15%;
        }

        #morphing-shapes-wrapper[data-configuration="2"] > .shape:nth-child(7) {
          left: 90%;
          top: 40%;
          height: 60%;
          width: 10%;
        }

        #morphing-shapes-wrapper[data-configuration="3"] > .shape:nth-child(1) {
          left: 0%;
          top: 16.5%;
          height: 32%;
          width: 20%;
        }

        #morphing-shapes-wrapper[data-configuration="3"] > .shape:nth-child(2) {
          left: 20%;
          top: 2.7%;
          height: 55%;
          width: 34%;
        }

        #morphing-shapes-wrapper[data-configuration="3"] > .shape:nth-child(3) {
          left: 38%;
          top: 0%;
          height: 100%;
          width: 62%;
        }

        #morphing-shapes-wrapper[data-configuration="3"] > .shape:nth-child(4) {
          left: 0%;
          top: 47.3%;
          height: 55%;
          width: 34%;
        }

        #morphing-shapes-wrapper[data-configuration="3"] > .shape:nth-child(5) {
          left: 34%;
          top: 56.4%;
          height: 32%;
          width: 20%;
        }

        #morphing-shapes-wrapper[data-configuration="3"] > .shape:nth-child(6) {
          left: 66%;
          top: 45%;
          height: 55%;
          width: 34%;
        }

        #morphing-shapes-wrapper[data-configuration="3"] > .shape:nth-child(7) {
          left: 80%;
          top: 68%;
          height: 32%;
          width: 20%;
        }

        #morphing-shapes-wrapper[data-roundness="1"] > .shape {
          border-radius: 6rem;
        }

        #morphing-shapes-wrapper[data-roundness="2"] > .shape {
          border-radius: 0rem;
        }

        #morphing-shapes-wrapper[data-roundness="3"] > .shape {
          border-radius: 30rem;
        }

        #morphing-shapes-wrapper[data-roundness="4"] > .shape:nth-child(1) {
          border-bottom-left-radius: 10rem;
        }

        #morphing-shapes-wrapper[data-roundness="4"] > .shape:nth-child(2) {
          border-radius: 20rem;
        }

        #morphing-shapes-wrapper[data-roundness="4"] > .shape:nth-child(3) {
          border-top-right-radius: 12rem;
        }

        #morphing-shapes-wrapper[data-roundness="4"] > .shape:nth-child(4) {
          border-top-right-radius: 10rem;
          border-bottom-right-radius: 10rem;
        }

        #morphing-shapes-wrapper[data-roundness="4"] > .shape:nth-child(5) {
          border-bottom-left-radius: 10rem;
        }

        #morphing-shapes-wrapper[data-roundness="4"] > .shape:nth-child(6) {
          border-top-left-radius: 16rem;
        }

        #morphing-shapes-wrapper[data-roundness="4"] > .shape:nth-child(7) {
          border-top-left-radius: 10rem;
        }
      `}</style>
      <div
        id="morphing-shapes-wrapper"
        ref={wrapperRef}
        data-configuration="1"
        data-roundness="1"
        className={className}
      >
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
    </>
  );
};

export default MorphingShapes;

