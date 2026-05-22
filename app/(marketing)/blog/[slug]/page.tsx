import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  FLEET_INTELLIGENCE_ARTICLES,
  FleetIntelligenceArticlePage,
  getFleetIntelligenceArticle,
} from "@/components/marketing/FleetIntelligenceContent";

type BlogArticleRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return FLEET_INTELLIGENCE_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: BlogArticleRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getFleetIntelligenceArticle(slug);

  if (!article) {
    return {
      title: "Fleet Intelligence | BackOfficeFleet",
    };
  }

  return {
    title: `${article.title} | BackOfficeFleet`,
    description: article.summary,
  };
}

export default async function BlogArticleRoute({ params }: BlogArticleRouteProps) {
  const { slug } = await params;
  const article = getFleetIntelligenceArticle(slug);

  if (!article) {
    notFound();
  }

  return <FleetIntelligenceArticlePage article={article} />;
}
