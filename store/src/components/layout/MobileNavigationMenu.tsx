import { useGetIdentity, useGo, useIsAuthenticated, useMany, useTranslate } from "@refinedev/core";
import { Sheet, SheetTrigger, SheetContent } from "../ui/sheet";
import { Button } from "../ui/button";
import { ChevronsUpDown, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Link } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { useMemo, useState } from "react";
import { getCategories, getFileURL } from "@/lib/utils";
import { useConfig } from "@/hooks/useConfig";

const MobileNavigationMenu = () => {
  const [open, setOpen] = useState(false);
  const t = useTranslate();
  const { config } = useConfig();
  const go = useGo();
  const { data } = useMany({
    dataProviderName: "storeProvider",
    resource: "categories",
    ids: [],
  });
  const {
    data: profile,
    isLoading,
    isFetching,
    isRefetching,
  } = useGetIdentity();
  const { data: authState } = useIsAuthenticated();

  const categories = useMemo(() => {
    if (!data?.message.results) {
      return {};
    }
    return getCategories(data?.message.results ?? []);
  }, [data?.message.results]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden border-0">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t("Toggle navigation menu")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <nav className="grid gap-6 text-lg font-medium">
          <button
            onClick={() =>
              go({
                to: `/`,
                query: {
                  filters: [],
                  resetPagenation: 1,
                },
                type: "push",
              })
            }
            className="flex items-center gap-2 text-lg font-semibold -mt-2"
          >
            {config?.brand_logo ? (
              <img
                src={getFileURL(config?.brand_logo) ?? ""}
                alt={config?.company}
                className="min-h-[30px] h-[30px] w-auto max-w-[200px]"
              />
            ) : (
              <h2>{config?.company}</h2>
            )}
          </button>
          <button
            onClick={() =>
              go({
                to: `/`,
                query: {
                  filters: [],
                  resetPagenation: 1,
                },
                type: "push",
              })
            }
            className="hover:text-foreground text-left"
          >
            {t("Home")}
          </button>
          <Link
            to="/account/orders"
            className="text-muted-foreground hover:text-foreground"
          >
            {t("Orders")}
          </Link>
          {/* nested categories as dropdown */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between space-x-4 text-muted-foreground hover:text-foreground">
                <button>{t("Categories")}</button>

                <ChevronsUpDown className="h-4 w-4" />
                <span className="sr-only">Toggle</span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="mt-2 flex flex-col pl-4">
                <RecursiveComponent
                  data={{ ...categories }}
                  setOpen={setOpen}
                />
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigationMenu;

const RecursiveComponent = ({ data, ...props }: any) => {
  const go = useGo();
  const pairs = Object.entries(data);

  return (
    <>
      {pairs.map(([categoryName, value]) => (
        <div
          className={`ml-1 border-l-2 pl-2 hover:border-foreground hover:!text-foreground ${
            decodeURI(window.location.search).includes(categoryName) ||
            Object.keys(value).find((key) =>
              decodeURI(window.location.search).includes(key)
            )
              ? "border-foreground !text-foreground"
              : ""
          }`}
        >
          <button
            key={categoryName}
            className={`py-1 text-left text-muted-foreground font-medium hover:text-foreground text-base pl-2 ${
              decodeURI(window.location.search).includes(categoryName)
                ? "border-foreground !text-foreground"
                : ""
            }`}
            onClick={() => {
              go({
                to: `/`,
                query: {
                  filters: [
                    {
                      field: "item_group",
                      operator: "eq",
                      value: categoryName,
                    },
                  ],
                },
                type: "push",
              });
              props.setOpen(false);
            }}
          >
            {categoryName}
          </button>
          <ul>
            <RecursiveComponent data={value} {...props} />
          </ul>
        </div>
      ))}
    </>
  );
};
