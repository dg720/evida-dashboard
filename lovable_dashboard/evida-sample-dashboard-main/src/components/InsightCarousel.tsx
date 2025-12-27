import { Card } from "@/components/ui/card";
import { TrendingUp, Heart, Activity, Users } from "lucide-react";

interface InsightCardData {
  icon: React.ReactNode;
  headline: string;
  comparison: string;
  actionTip: string;
}

const insights: InsightCardData[] = [
  {
    icon: <TrendingUp className="w-6 h-6 text-success" />,
    headline: "Your BMI is within the healthy range",
    comparison: "Better than 60% of peers your age",
    actionTip: "Maintaining regular activity will help sustain this trend",
  },
  {
    icon: <Heart className="w-6 h-6 text-primary" />,
    headline: "Blood pressure is optimal",
    comparison: "Lower than 75% of people in your demographic",
    actionTip: "Keep up your current diet and exercise routine",
  },
  {
    icon: <Activity className="w-6 h-6 text-secondary" />,
    headline: "Weight trending positively",
    comparison: "Within healthy range for your height",
    actionTip: "Continue balanced nutrition and physical activity",
  },
  {
    icon: <Users className="w-6 h-6 text-primary" />,
    headline: "Overall health metrics are strong",
    comparison: "Ranking in top 40% of your peer group",
    actionTip: "Regular monitoring will help maintain these levels",
  },
];

const InsightCarousel = () => {
  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'hsl(var(--primary) / 0.3) hsl(var(--muted))'
      }}>
        {insights.map((insight, index) => (
          <Card
            key={index}
            className="min-w-[320px] md:min-w-[380px] p-6 snap-start hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                {insight.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {insight.headline}
                </h3>
                <p className="text-sm text-primary font-medium mb-2">
                  {insight.comparison}
                </p>
                <p className="text-sm text-muted-foreground">
                  {insight.actionTip}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InsightCarousel;
