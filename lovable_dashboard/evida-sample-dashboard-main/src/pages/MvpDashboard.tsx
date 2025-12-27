import Navigation from "@/components/Navigation";
import CoreMetricCard from "@/components/CoreMetricCard";
import InsightCarousel from "@/components/InsightCarousel";
import { Ruler, Weight, Activity, Heart, Construction } from "lucide-react";

const MvpDashboard = () => {
  // Mock chart data showing realistic health trends
  const heightData = [
    { date: "Jan", value: 175 },
    { date: "Feb", value: 175 },
    { date: "Mar", value: 175 },
    { date: "Apr", value: 175 },
  ];

  const weightData = [
    { date: "Jan", value: 74 },
    { date: "Feb", value: 73 },
    { date: "Mar", value: 72.5 },
    { date: "Apr", value: 72 },
  ];

  const bmiData = [
    { date: "Jan", value: 24.0 },
    { date: "Feb", value: 23.8 },
    { date: "Mar", value: 23.6 },
    { date: "Apr", value: 23.5 },
  ];

  const bpData = [
    { date: "Jan", value: 134 },
    { date: "Feb", value: 130 },
    { date: "Mar", value: 129 },
    { date: "Apr", value: 128 },
  ];

  return (
    <div className="min-h-screen pb-12">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Section 1: Hero KPI Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Core Health Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CoreMetricCard
              title="Height"
              value="175"
              unit="cm"
              status="ok"
              icon={Ruler}
              chartData={heightData}
              trend="Stable"
            />
            <CoreMetricCard
              title="Weight"
              value="72"
              unit="kg"
              status="ok"
              icon={Weight}
              chartData={weightData}
              trend="↓ 2kg from last month"
              yAxisDomain={[65, 78]}
              healthyRange={[68, 75]}
            />
            <CoreMetricCard
              title="BMI"
              value="23.5"
              unit=""
              status="ok"
              icon={Activity}
              chartData={bmiData}
              trend="Healthy range"
              yAxisDomain={[15, 30]}
              healthyRange={[18.5, 24.9]}
            />
            <CoreMetricCard
              title="Blood Pressure"
              value="128/82"
              unit="mmHg"
              status="ok"
              icon={Heart}
              chartData={bpData}
              trend="↓ 6 mmHg from last scan"
              yAxisDomain={[115, 145]}
              healthyRange={[120, 135]}
            />
          </div>
        </section>

        {/* Section 2: Insights & Benchmarking */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Personalized Insights & Benchmarking
          </h2>
          <InsightCarousel />
        </section>

        {/* Section 3: Under Construction */}
        <section className="mb-12">
          <div className="bg-card rounded-2xl p-12 text-center border border-border">
            <div className="max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Construction className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                More metrics and insights coming soon
              </h2>
              <p className="text-lg text-muted-foreground mb-2">
                Your full health dashboard is under construction.
              </p>
              <p className="text-muted-foreground">
                Expect advanced labs, sleep, activity, and nutrition insights here in the future.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MvpDashboard;
