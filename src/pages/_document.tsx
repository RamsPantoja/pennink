import { Head, Html, Main, NextScript } from "next/document";
import { GeistSans } from "geist/font/sans";
import { cn } from "~/lib/utils";
import { inter } from "~/lib/fonts";

export default function Document() {
  return (
    <Html
      lang="en"
      className={cn(GeistSans.className, "font-sans", inter.variable)}
    >
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
