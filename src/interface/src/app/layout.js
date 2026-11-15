import "./globals.css";
import { texts } from "../i18n/pt-BR";

export const metadata = {
  title: texts.appTitle,
  description: texts.appSubtitle,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="container">
          <header className="header">
            <h1 className="title">{texts.appTitle}</h1>
            <p className="subtitle">{texts.appSubtitle}</p>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
