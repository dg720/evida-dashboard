import { LucideIcon } from "lucide-react";

interface InsightCardProps {
  icon: LucideIcon;
  headline: string;
  description: string;
  iconColor?: string;
}

const InsightCard = ({ icon: Icon, headline, description, iconColor = "text-primary" }: InsightCardProps) => {
  return (
    <div className="bg-card rounded-2xl p-6 card-shadow hover:shadow-xl transition-all">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0">
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-bold text-foreground mb-2 leading-tight">{headline}</h4>
          <p className="text-sm text-muted-foreground/90 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
