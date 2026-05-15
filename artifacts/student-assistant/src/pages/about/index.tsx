import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Globe, Cpu, Users, Target, TrendingUp, Star, Lightbulb, GraduationCap, Brain, BarChart3 } from "lucide-react";

export default function AboutPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">LA</div>
            <span className="font-bold text-lg">Learning Assistant</span>
          </div>
          <Button variant="ghost" onClick={() => setLocation("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">

        {/* Hero */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full">
            <Globe className="w-4 h-4" />
            Our Mission & Global Alignment
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight text-foreground">
            Empowering Students Through<br />
            <span className="text-primary">AI-Driven Education</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The Learning Assistant platform is built on a commitment to equitable, quality education for every student — aligned with global sustainability goals and national digital transformation visions.
          </p>
        </section>

        {/* SDG 4 */}
        <section className="space-y-10">
          <div className="flex items-start gap-6">
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-lg">4</div>
            <div>
              <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">United Nations Sustainable Development Goal</p>
              <h2 className="text-3xl font-extrabold text-foreground">SDG 4 — Quality Education</h2>
              <p className="text-muted-foreground mt-2 text-lg">Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all.</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8">
            <p className="text-foreground text-lg leading-relaxed mb-6">
              SDG 4 is one of the 17 Sustainable Development Goals adopted by the United Nations in 2015. It calls for universal access to quality education, elimination of gender and income disparities in learning, and the promotion of lifelong learning skills including digital literacy and critical thinking.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: BookOpen, title: "Inclusive Learning", desc: "Accessible AI tutoring available to every student, regardless of location or background." },
                { icon: Brain, title: "Personalized AI Tutor", desc: "Gemini-powered assistant adapts explanations to each student's level and learning pace." },
                { icon: BarChart3, title: "Progress Tracking", desc: "Data-driven insights help identify learning gaps and celebrate student growth." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "SDG 4.1", desc: "Free, equitable, quality primary and secondary education for all students." },
              { label: "SDG 4.4", desc: "Substantially increase youth with ICT and technical skills for employment." },
              { label: "SDG 4.5", desc: "Eliminate gender disparities and ensure equal access to education." },
              { label: "SDG 4.7", desc: "Ensure all learners acquire knowledge for sustainable development and global citizenship." },
            ].map(({ label, desc }) => (
              <div key={label} className="flex items-start gap-4 p-5 bg-card border border-border rounded-xl">
                <div className="shrink-0 w-14 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-xs font-bold">{label}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Vision 2030 */}
        <section className="space-y-10">
          <div className="flex items-start gap-6">
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-lg">2030</div>
            <div>
              <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-1">National Education Transformation</p>
              <h2 className="text-3xl font-extrabold text-foreground">Vision 2030 — Digital Education for All</h2>
              <p className="text-muted-foreground mt-2 text-lg">Transforming education systems through digital infrastructure, teacher empowerment, and student-centered learning by 2030.</p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8">
            <p className="text-foreground text-lg leading-relaxed mb-8">
              Vision 2030 represents a bold commitment to modernizing education systems through digital transformation. At its core is the belief that every student deserves access to world-class learning resources, powered by technology and enabled by strong institutions. The Learning Assistant directly supports this vision by:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { icon: Cpu, title: "AI-Powered Learning", desc: "Deploying cutting-edge Gemini AI to deliver personalized tutoring that was previously only available to privileged students with private tutors." },
                { icon: Users, title: "Democratizing Education", desc: "Multi-role platform enabling students, teachers, and school administrators to collaborate in a unified digital learning environment." },
                { icon: Target, title: "Data-Driven Outcomes", desc: "Real-time quiz analytics and performance dashboards give educators actionable data to improve learning outcomes at scale." },
                { icon: GraduationCap, title: "Skills for the Future", desc: "Cultivating digital literacy, critical thinking, and self-directed learning habits that are essential for the 21st-century workforce." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 bg-white rounded-xl p-5 border border-emerald-100 shadow-sm">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-600/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { value: "100%", label: "Digital Classrooms" },
              { value: "AI-First", label: "Learning Approach" },
              { value: "24/7", label: "Tutor Availability" },
              { value: "3 Roles", label: "Stakeholder Coverage" },
            ].map(({ value, label }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="text-2xl font-black text-primary mb-1">{value}</div>
                <div className="text-xs text-muted-foreground font-medium">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Vision 2035 */}
        <section className="space-y-10">
          <div className="flex items-start gap-6">
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-black text-lg shadow-lg">2035</div>
            <div>
              <p className="text-sm font-bold text-violet-600 uppercase tracking-widest mb-1">Future Education Roadmap</p>
              <h2 className="text-3xl font-extrabold text-foreground">Vision 2035 — AI-Native Education Systems</h2>
              <p className="text-muted-foreground mt-2 text-lg">Building the next generation of intelligent, adaptive, and universally accessible learning ecosystems by 2035.</p>
            </div>
          </div>

          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-8">
            <p className="text-foreground text-lg leading-relaxed mb-8">
              Vision 2035 looks beyond digital infrastructure to a future where AI is embedded at the heart of every learning interaction. Students will benefit from hyper-personalized curriculum, instant feedback loops, and intelligent assessment systems that understand not just what a student answered, but how they think. The Learning Assistant is a foundational step toward this future.
            </p>
            <div className="space-y-4">
              {[
                { phase: "Phase 1 (Now)", title: "AI Tutoring Foundation", desc: "Conversational AI tutoring, static quiz library, and multi-role dashboards for students, administrators, and clients.", color: "bg-primary" },
                { phase: "Phase 2 (2027)", title: "Adaptive Assessment Engine", desc: "AI-generated quizzes tailored to each student's current knowledge state, with dynamic difficulty adjustment and topic gap analysis.", color: "bg-violet-400" },
                { phase: "Phase 3 (2030)", title: "Predictive Learning Pathways", desc: "Machine learning models that predict learning outcomes and proactively recommend resources, interventions, and study schedules.", color: "bg-violet-500" },
                { phase: "Phase 4 (2035)", title: "Universal AI Education", desc: "Fully personalized, AI-native curriculum delivery accessible to every student globally — eliminating educational inequality entirely.", color: "bg-violet-700" },
              ].map(({ phase, title, desc, color }) => (
                <div key={phase} className="flex items-start gap-4 bg-white rounded-xl p-5 border border-violet-100 shadow-sm">
                  <div className={`shrink-0 ${color} text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap mt-0.5`}>{phase}</div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How we support */}
        <section className="bg-sidebar text-sidebar-foreground rounded-3xl p-10 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-sm font-semibold px-4 py-2 rounded-full">
              <Star className="w-4 h-4" />
              Our Platform's Contribution
            </div>
            <h2 className="text-3xl font-extrabold">How Learning Assistant Drives Change</h2>
            <p className="text-sidebar-foreground/70 text-lg max-w-2xl mx-auto">Every feature we build is designed with SDG 4, Vision 2030, and Vision 2035 in mind.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Lightbulb, title: "Gemini AI Tutor", desc: "Provides 24/7 intelligent tutoring, eliminating the barrier of access to quality academic support." },
              { icon: Brain, title: "AI Quiz Generator", desc: "Creates personalized assessments from any topic the student is studying, enabling self-directed learning." },
              { icon: TrendingUp, title: "Progress Analytics", desc: "Multi-stakeholder dashboards give students, admins, and school clients a clear picture of learning trajectories." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/10 rounded-2xl p-6 space-y-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg">{title}</h3>
                <p className="text-sidebar-foreground/70 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center pt-4">
            <Button
              onClick={() => setLocation("/")}
              className="bg-white text-sidebar hover:bg-white/90 font-semibold px-8 py-3 rounded-full text-base shadow-lg"
            >
              Start Learning Now
            </Button>
          </div>
        </section>

      </main>

      <footer className="border-t border-border bg-card py-8 mt-16">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Learning Assistant Platform · Advancing SDG 4 Quality Education · Supporting Vision 2030 &amp; Vision 2035</p>
        </div>
      </footer>
    </div>
  );
}
