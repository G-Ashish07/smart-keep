import { LogOut, Menu, UserCircle } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              SK
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-normal">SmartKeep</h1>
              <p className="text-xs text-muted-foreground">AI-enhanced notes</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="max-w-[220px] justify-start">
                <UserCircle className="h-4 w-4 shrink-0" />
                <span className="hidden truncate sm:inline">{user?.email}</span>
                <Menu className="ml-auto h-4 w-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      {children}
    </div>
  );
}
