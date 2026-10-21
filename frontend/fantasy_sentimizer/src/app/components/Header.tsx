import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Header() {
    return (
        <header className="flex flex-row justify-between p-4 text-center ">
            <Link href="/">
                <h1
                    className="text-xl sm:text-2xl font-bold text-gray-800 cursor-pointer"
                >
                    Fantasy Sentimizer
                </h1>
            </Link>

            <div className="shrink-0">
                <Button>
                    <a href="/" className="text-white-700 hover:text-white-900">
                        Home
                    </a>
                </Button>
            </div>
        </header>
    );
}