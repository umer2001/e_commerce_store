import { useRef, useState } from "react";
import { useIntersection } from "react-use";
import {
  SfScrollable,
  SfButton,
  SfIconChevronLeft,
  SfIconChevronRight,
  type SfScrollableOnDragEndData,
} from "@storefront-ui/react";
import classNames from "classnames";

type ProductImagesProps = {
  images: {
    imageSrc: string;
    imageThumbSrc: string;
    alt: string;
  }[];
};

const ProductImages = ({ images }: ProductImagesProps) => {
  const lastThumbRef = useRef<HTMLButtonElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const firstThumbRef = useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const firstThumbVisible = useIntersection(firstThumbRef, {
    root: thumbsRef.current,
    rootMargin: "0px",
    threshold: 1,
  });

  const lastThumbVisible = useIntersection(lastThumbRef, {
    root: thumbsRef.current,
    rootMargin: "0px",
    threshold: 1,
  });

  const onDragged = (event: SfScrollableOnDragEndData) => {
    if (event.swipeRight && activeIndex > 0) {
      setActiveIndex((currentActiveIndex) => currentActiveIndex - 1);
    } else if (event.swipeLeft && activeIndex < images.length - 1) {
      setActiveIndex((currentActiveIndex) => currentActiveIndex + 1);
    }
  };
  return (
    <div className="relative flex w-full aspect-square lg:aspect-[4/3]">
      <SfScrollable
        ref={thumbsRef}
        className="hidden lg:flex sticky top-[calc(57px_+_16px)] items-center w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        direction="vertical"
        activeIndex={activeIndex}
        prevDisabled={activeIndex === 0}
        nextDisabled={activeIndex === images.length - 1}

        // Button arrows may be used later, so I added 'hidden' class to them.
        slotPreviousButton={
          <SfButton
            className={classNames(
              "absolute !rounded-full z-10 top-4 rotate-90 bg-white hidden",
              {
                hidden: firstThumbVisible?.isIntersecting,
              }
            )}
            variant="secondary"
            size="sm"
            square
            slotPrefix={<SfIconChevronLeft size="sm" />}
          />
        }
        slotNextButton={
          <SfButton
            className={classNames(
              "absolute !rounded-full z-10 bottom-4 rotate-90 bg-white hidden",
              {
                hidden: lastThumbVisible?.isIntersecting,
              }
            )}
            variant="secondary"
            size="sm"
            square
            slotPrefix={<SfIconChevronRight size="sm" />}
          />
        }
      >
        {images.map(({ imageThumbSrc, alt }, index, thumbsArray) => (
          <button
            // eslint-disable-next-line no-nested-ternary
            ref={
              index === thumbsArray.length - 1
                ? lastThumbRef
                : index === 0
                ? firstThumbRef
                : null
            }
            type="button"
            aria-label={alt}
            aria-current={activeIndex === index}
            key={`${alt}-${index}-thumbnail`}
            className={classNames(
              "w-full h-full relative shrink-0 snap-center cursor-pointer focus-visible:outline focus-visible:outline-offset transition-colors flex-grow md:flex-grow-0",
              {
                "border-primary-700": activeIndex === index,
                "border-transparent": activeIndex !== index,
              }
            )}
            onMouseOver={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
          >
            <img
              alt={alt}
              src={imageThumbSrc}
              width={134}
              height={134}
              className="object-cover w-full h-full aspect-square"
            />
          </button>
        ))}
      </SfScrollable>
      <SfScrollable
        className="lg:ml-8 w-full h-full snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        activeIndex={activeIndex}
        direction="vertical"
        wrapperClassName="h-full m-auto"
        buttonsPlacement="none"
        isActiveIndexCentered
        drag={{ containerWidth: true }}
        onDragEnd={onDragged}
      >
        {images.map(({ imageSrc, alt }, index) => (
          <div
            key={`${alt}-${index}`}
            className="flex justify-start h-full basis-full shrink-0 grow snap-center"
          >
            <img
              aria-label={alt}
              aria-hidden={activeIndex !== index}
              className="object-cover w-full h-full lg:min-w-[500px] lg:min-h-[500px] lg:max-w-[500px] lg:max-h-[500px]"
              alt={alt}
              src={imageSrc}
            />
          </div>
        ))}
      </SfScrollable>
    </div>
  );
};

export default ProductImages;
