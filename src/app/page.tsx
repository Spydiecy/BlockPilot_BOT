import dynamic from 'next/dynamic';

const HeroSection = dynamic(
  () => import('@/components/blocks/3d-hero-section-boxes').then((mod) => mod.HeroSection),
  {
    loading: () => <div className="h-screen bg-black" />,
  }
);

const HomeSections = dynamic(
  () => import('@/components/blocks/home-sections').then((mod) => mod.HomeSections),
  {
    loading: () => <div className="min-h-screen bg-black" />,
  }
);

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <HeroSection />
      <HomeSections />
    </main>
  );
}
