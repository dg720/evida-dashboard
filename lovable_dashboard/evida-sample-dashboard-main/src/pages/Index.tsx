import Navigation from "@/components/Navigation";
import ReadinessCard from "@/components/ReadinessCard";
import SleepCard from "@/components/SleepCard";
import ActivityCard from "@/components/ActivityCard";
import StressCard from "@/components/StressCard";
import BiomarkerCard from "@/components/BiomarkerCard";
import LifestyleCard from "@/components/LifestyleCard";
import SleepTrendChart from "@/components/SleepTrendChart";
import RadarHealthChart from "@/components/RadarHealthChart";
import InsightCard from "@/components/InsightCard";
import { TrendingUp, Heart, Droplet, Sun, Activity, FlaskConical, BarChart3, Lightbulb, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen pb-12">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Section 1: Today's Health Snapshot */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Today's Health Snapshot</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ReadinessCard
              score={87}
              status="Optimal"
              insight="Bring it on — today is a good day for high-focus tasks."
            />
            <SleepCard score={84} duration="6h 56m" status="Good" />
            <ActivityCard percentage={65} current="6,574" goal="10,000" />
            <StressCard status="Resilient" level="low" hrv={58} baseline={70} />
          </div>
        </section>

        {/* Section 2: Lifestyle Quick Cards */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Lifestyle at a Glance</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              Read more <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <LifestyleCard title="Sleep" value="6:56" unit="h" status="ok" />
            <LifestyleCard title="Activity" value="12k" unit="steps" status="target" />
            <LifestyleCard title="Resting HR" value="52" unit="bpm" status="elevated" />
            <LifestyleCard title="Iron" value="55" unit="μg/dL" status="high" />
            <LifestyleCard title="AST" value="45" unit="U/L" status="ok" />
          </div>
        </section>

        {/* Section 3: Biomarker Cards */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Lab & Blood Tests</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              Read more <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BiomarkerCard
              title="LDL Cholesterol"
              value="150"
              unit="mg/dl"
              status="high"
              rangePosition={75}
              insight="Elevated LDL increases cardiovascular risk. Consider dietary changes and increase fiber intake."
              trend="up"
            />
            <BiomarkerCard
              title="Creatinine"
              value="1.3"
              unit="mg/dl"
              status="elevated"
              rangePosition={60}
              insight="Elevated creatinine levels could indicate kidney dysfunction when combined with dehydration or prolonged elevated heart rate."
              trend="stable"
            />
            <BiomarkerCard
              title="Vitamin D"
              value="32"
              unit="ng/mL"
              status="target"
              rangePosition={35}
              insight="Vitamin D is in target range. Maintaining adequate levels supports bone health and immune function."
              trend="down"
            />
            <BiomarkerCard
              title="TSH"
              value="5.0"
              unit="mIU/L"
              status="elevated"
              rangePosition={65}
              insight="Elevated TSH may indicate subclinical hypothyroidism. Consider thyroid panel for comprehensive assessment."
              trend="up"
            />
            <BiomarkerCard
              title="Fasting Glucose"
              value="105"
              unit="mg/dL"
              status="elevated"
              rangePosition={55}
              insight="Slightly elevated fasting glucose. Consider dietary modifications and regular physical activity."
              trend="stable"
            />
          </div>
        </section>

        {/* Section 4 & 5: Trend Graphs and Radar Chart */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-warning" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Visual Insights</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              Read more <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SleepTrendChart />
            <RadarHealthChart />
          </div>
        </section>

        {/* Section 6: Insights Feed */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Personalized Insights</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              Read more <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InsightCard
              icon={TrendingUp}
              headline="Your LDL has increased since April"
              description="Consider dietary changes such as reducing saturated fat intake and increasing fiber. Regular exercise can also help manage cholesterol levels."
              iconColor="text-destructive"
            />
            <InsightCard
              icon={Heart}
              headline="Better sleep improves your resting heart rate"
              description="On nights with >7h sleep, your resting HR is 5 bpm lower. Prioritize consistent sleep schedule for cardiovascular benefits."
              iconColor="text-primary"
            />
            <InsightCard
              icon={Sun}
              headline="Vitamin D trending positive"
              description="Your vitamin D levels have improved. Continue current sunlight exposure and dietary habits to maintain optimal levels."
              iconColor="text-warning"
            />
            <InsightCard
              icon={Droplet}
              headline="Stress logged 3x this week"
              description="Consider stress management techniques such as meditation, deep breathing exercises, or a short walk in nature."
              iconColor="text-secondary"
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
