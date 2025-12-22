import { YearInReview } from "@/components/YearInReview";
import { Navigation } from "@/components/Navigation";

const YearInReviewPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <YearInReview />
      </main>
    </div>
  );
};

export default YearInReviewPage;
