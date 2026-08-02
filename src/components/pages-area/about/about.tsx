import "./about.css";

// About page describing the project, the technologies and the developer.
export function About() {
    return (
        <div className="About">

            <div className="profile">

                <div className="photo" role="img" aria-label="Itay Goldenberg"></div>

                <h2>Itay Goldenberg</h2>
                <p className="role">Full Stack Developer Student</p>

                <div className="links">
                    <a className="github" href="https://github.com/itaygoldenberg" target="_blank" rel="noreferrer" aria-label="GitHub"></a>
                    <a className="linkedin" href="https://www.linkedin.com/in/itay-goldenberg/" target="_blank" rel="noreferrer" aria-label="LinkedIn"></a>
                </div>

            </div>

            <div className="section">
                <h3>About Me</h3>
                <p>
                    My name is Itay Goldenberg. I am a 25-year-old Full Stack Gen AI student
                    at John Bryce, based in Afula, Israel. I focus on building clean, practical
                    and user-friendly web applications.
                </p>
            </div>

            <div className="section">
                <h3>About The Project</h3>
                <p>
                    Cryptonite is a React and TypeScript single page application that presents
                    live data about the top 100 cryptocurrencies. Users can search for a coin,
                    view its current price in USD, EUR and ILS, and select up to five coins for
                    tracking. The Reports page uses a live connection and adds a readable chart
                    point each second. The AI Advice page sends real market data to ChatGPT and returns a
                    buying recommendation together with a detailed explanation.
                </p>
            </div>

            <div className="section">
                <h3>Technologies</h3>
                <ul className="tech-grid">
                    <li className="react">React</li>
                    <li className="typescript">TypeScript</li>
                    <li className="redux">Redux Toolkit</li>
                    <li className="router">React Router</li>
                    <li className="axios">Axios</li>
                    <li className="recharts">Recharts</li>
                    <li className="css">CSS</li>
                    <li className="vite">Vite</li>
                    <li className="openai">OpenAI API</li>
                    <li className="coincap">CoinCap API</li>
                    <li className="coingecko">CoinGecko API</li>
                </ul>
            </div>

        </div>
    );
}
