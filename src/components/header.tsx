import { CircleUser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type HeaderProps = {
  language: string;
  setLanguage: (language: string) => void;
};

export default function Header({ language, setLanguage }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label="wave">🌊</span>
          <h1 className="text-lg font-bold font-headline text-foreground sm:text-xl">
            ALL-IN-1 FISHERMAN
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="ta">தமிழ்</SelectItem>
              <SelectItem value="te">తెలుగు</SelectItem>
              <SelectItem value="hi">हिन्दी</SelectItem>
              <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
              <SelectItem value="ml">മലയാളം</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
