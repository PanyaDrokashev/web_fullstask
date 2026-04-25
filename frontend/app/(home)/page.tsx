import Hero from "./components/Hero";
import Info from "./components/Info";
import Catalog from "./components/Catalog";
import Articles from "./components/Articles";

import {
  BulbIcon,
  CubeIcon,
  IIconProps,
  LayersIcon,
  PersonWorkerIcon,
} from "@/components/Icons";
import React from "react";
import { getArticles, getCatalogItems, getHomeData } from "@/shared/api/content";

export interface IInfoData {
  Icon: React.ComponentType<IIconProps>;
  title: string;
  text?: string;
}

const infoIconsMap: Record<string, React.ComponentType<IIconProps>> = {
  "person-worker": PersonWorkerIcon,
  bulb: BulbIcon,
  cube: CubeIcon,
  layers: LayersIcon,
};

export default async function Home() {
  const [homeData, catalogItems, articles] = await Promise.all([
    getHomeData(),
    getCatalogItems(),
    getArticles(),
  ]);

  const data: IInfoData[] = homeData.infoCards.map((item) => ({
    Icon: infoIconsMap[item.iconKey],
    title: item.title,
    text: item.text,
  }));

  return (
    <div className="bg-mainbg">
      <Hero
        cardsData={data}
        heroTitle={homeData.heroTitle}
        heroSubtitle={homeData.heroSubtitle}
        heroLeadText={homeData.heroLeadText}
      />
      <div className="py-14 md:py-24">
        <Info cardsData={data} infoLeadText={homeData.infoLeadText} />
        <Catalog items={catalogItems} />
        <Articles items={articles} />
      </div>
    </div>
  );
}
