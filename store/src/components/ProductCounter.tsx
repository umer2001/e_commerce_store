import { useCart } from "@/hooks/useCart";
import { Button } from "./ui/button";
import { Minus, Plus } from "lucide-react";

type ProductCounterProps = {
  itemCode: string;
  size: "sm" | "lg";
};

const ProductCounter = ({ itemCode, size = "sm" }: ProductCounterProps) => {
  const { cart, addToCart } = useCart();
  return (
    <div className="flex items-center justify-between lg:justify-start w-full">
      <h2 className="text-darkgray-400 lg:hidden text-sm">จำนวน</h2>
      <div className="flex items-center rounded-xl bg-darkgray-100 h-12.5 text-darkgray-200">
        <Button
          variant="ghost"
          size={size}
          onClick={() => addToCart(itemCode, -1)}
          className="px-4 !bg-darkgray-100"
        >
          <Minus size={size === "sm" ? 12 : 18} />
        </Button>
        <span className="px-2">{cart[itemCode] ?? 0}</span>
        <Button 
          variant="ghost" 
          size={size} 
          onClick={() => addToCart(itemCode)}
          className="px-4 !bg-darkgray-100"
        >
          <Plus size={size === "sm" ? 12 : 18} />
        </Button>
      </div>
    </div>
  );
};

export default ProductCounter;
