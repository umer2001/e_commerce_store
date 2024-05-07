import { useCart } from "../../hooks/useCart";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTranslate } from "@refinedev/core";
import CartItem from "./CartItem";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/hooks/useWishlist";
import EmptyList from "../customComponents/EmptyList";
import useConfig from "@/hooks/useConfig";
import { FlipBackward, Heart, ShoppingBag01 } from "@untitled-ui/icons-react";
import { formatCurrency } from "@/lib/utils";

const Cart = () => {
  const t = useTranslate();
  const { config } = useConfig();
  const navigate = useNavigate();
  const { cart, cartCount, cartTotal, serverCart } = useCart();
  const { setIsOpen } = useWishlist();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full relative hover:bg-transparent "
        >
          <ShoppingBag01 className="h-[22px] w-[22px]" />
          {cartCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex items-center justify-center h-4 w-4 bg-primary text-xs text-white rounded-full">
              {cartCount}
            </span>
          )}
          <span className="sr-only">View cart</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col justify-between h-full p-5">
        <SheetHeader className="bg-white -m-5 flex flex-row items-center justify-between z-10 px-4 py-3 border-b">
          <SheetClose asChild>
            <FlipBackward className="h-5 w-5 cursor-pointer hover:opacity-75" />
          </SheetClose>

          <SheetTitle className="!m-0 text-base">{t("Shopping Cart")}</SheetTitle>

          <Heart
            className="h-5 w-5 cursor-pointer hover:opacity-75 !m-0"
            onClick={() => setIsOpen(true)}
          />
        </SheetHeader>
        {cartCount > 0 ? (
          <ul className="my-3 flex flex-col gap-y-3 pt-3">
            {Object.entries(cart).map(([itemCode, quantity]) => {
              if (!quantity) {
                return null;
              }
              return <CartItem key={itemCode} itemCode={itemCode} />;
            })}
          </ul>
        ) : (
          <EmptyList 
            icon={<ShoppingBag01 className="text-white w-[30px] h-[30px]"/>}
            title={t("Empty_cart.title")}
            desc={t("Empty_cart.desc")}
          />
        )}
        <SheetFooter className="block sm:justify-center mt-auto">
          <div className="flex flex-col gap-y-6">
            {cartCount > 0 && (
              <div className="flex justify-between items-center text-sm font-semibold">
                <h5>{t("Total")}</h5>
                <p>{typeof cartTotal === "string" ? cartTotal : formatCurrency(cartTotal, serverCart?.message.doc.price_list_currency ?? "THB")}</p>
              </div>
            )}

            <div className="flex flex-col gap-y-2">
              <SheetClose asChild>
                {config?.show_contact_us_button ? (
                  <Button
                    disabled={cartCount === 0}
                    className="inset-2 w-full"
                    size="lg"
                    onClick={() => window.open(config?.contact_us_url, "_blank")}
                  >
                    {config?.contact_us_label}
                  </Button>
                ) : (
                  <Button
                    // disabled={cartCount === 0}
                    className="inset-2 w-full"
                    size="lg"
                    onClick={() => navigate(cartCount > 0 ? "/checkout" : "/")}
                  >
                    {t(cartCount > 0 ? "Checkout" : "Shop now")}
                    <ShoppingBag01 className="ml-2 h-5 w-5" />
                  </Button>
                )}
              </SheetClose>

              <p className="text-darkgray-600 text-xs text-center">{t("When make payment cart")}</p>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default Cart;
