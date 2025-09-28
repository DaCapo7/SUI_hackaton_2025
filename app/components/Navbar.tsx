"use client";

import * as React from "react";
import Link from "next/link";
import { ConnectButton } from "@mysten/dapp-kit";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Love Lock",
    href: "/lock",
    description: "View and interact with love lock components.",
  },
  {
    title: "Create Love Lock",
    href: "/create",
    description: "Create a new love lock on the blockchain.",
  },
  {
    title: "About",
    href: "/about",
    description: "Learn more about this love lock application.",
  },
];

export default function Navbar() {
  return (
    <NavigationMenu className="max-w-full justify-between p-4 love-lock-card border-b border-pink-200">
      <NavigationMenuList className="flex w-full justify-between items-center">
        <div className="flex items-center space-x-6">
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/" className="flex items-center space-x-2 font-semibold text-lg love-lock-text">
                Love Lock App
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <NavigationMenuTrigger className="love-lock-text">Features</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] love-lock-card">
                <li className="row-span-3">
                  <NavigationMenuLink asChild>
                    <Link
                      className="flex h-full w-full select-none flex-col justify-end rounded-md love-lock-accent p-6 no-underline outline-none focus:shadow-md"
                      href="/"
                    >
                      <div className="mb-2 mt-4 text-lg font-medium love-lock-text">
                        Love Lock App
                      </div>
                      <p className="text-sm leading-tight love-lock-text-muted">
                        A beautiful love lock application built with Next.js and Tailwind CSS.
                      </p>
                    </Link>
                  </NavigationMenuLink>
                </li>
                {components.map((component) => (
                  <ListItem
                    key={component.title}
                    title={component.title}
                    href={component.href}
                  >
                    {component.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link href="/" className="love-lock-text">Home</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </div>

        <NavigationMenuItem className="flex ml-auto">
          <ConnectButton />
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-pink-100 hover:love-lock-text focus:bg-pink-100 focus:love-lock-text ${className}`}
          {...props}
        >
          <div className="text-sm font-medium leading-none love-lock-text">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug love-lock-text-muted">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";