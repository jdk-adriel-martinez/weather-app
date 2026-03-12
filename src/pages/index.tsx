import Head from "next/head";
import { WeatherPanel } from "@/components/WeatherPanel";

export default function Home() {
  return (
    <>
      <Head>
        <title>Weather App</title>
        <meta
          name="description"
          content="Aplicacion sencilla para consultar el clima"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <WeatherPanel />
    </>
  );
}
