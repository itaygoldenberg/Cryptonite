import { useState } from "react";
import { Header } from "../header/header";
import { Menu } from "../menu/menu";
import { Routing } from "../routing/routing";
import { SearchBox } from "../../coins-area/search-box/search-box";
import { AiAdviceWidget } from "../../pages-area/ai-advice/ai-advice-widget";
import "./layout.css";

// Overall page structure: navbar with the title, menu and search, and the routed content.
export function Layout() {
    const [isAiOpen, setIsAiOpen] = useState(false);

    return (
        <div className="Layout">
            <header>
                <Header />
                <nav>
                    <Menu />
                    <SearchBox />
                </nav>
            </header>
            <main>
                <Routing />
            </main>
            <AiAdviceWidget
                open={isAiOpen}
                onOpen={() => setIsAiOpen(true)}
                onClose={() => setIsAiOpen(false)}
            />
        </div>
    );
}
