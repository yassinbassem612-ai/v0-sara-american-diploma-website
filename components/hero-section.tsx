import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Target, Users, Award } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

async function getHomeContent() {
  const supabase = createClient()
  const { data, error } = await supabase.from("home_content").select("*").limit(1)

  if (error) {
    console.error("Error fetching home content:", error)
    return null
  }

  return data && data.length > 0 ? data[0] : null
}

export async function HeroSection() {
  const homeContent = await getHomeContent()

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Master Your <span className="text-primary">Math Skills</span> for Academic Success
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            {homeContent?.about_text ||
              "Expert SAT, ACT, and EST test preparation with personalized tutoring and comprehensive study materials."}
          </p>

          {homeContent?.free_session_link && (
            <div className="mb-16">
              <Card className="max-w-md mx-auto border-primary/20 hover:border-primary/50 transition-colors duration-300">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    {homeContent?.video_title || "Book Your Free Session"}
                  </h3>
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-semibold"
                    asChild
                  >
                    <a href={homeContent.free_session_link} target="_blank" rel="noopener noreferrer">
                      {homeContent.video_title ? "Watch Now" : "Book Now"}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border/50 hover:border-primary/50 transition-colors duration-300">
              <CardContent className="p-6 text-center">
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">SAT Prep</h3>
                <p className="text-sm text-muted-foreground">Comprehensive SAT math preparation</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors duration-300">
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">ACT Prep</h3>
                <p className="text-sm text-muted-foreground">Targeted ACT math strategies</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors duration-300">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">EST Prep</h3>
                <p className="text-sm text-muted-foreground">Expert EST exam preparation</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors duration-300">
              <CardContent className="p-6 text-center">
                <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Expert Tutoring</h3>
                <p className="text-sm text-muted-foreground">Personalized one-on-one sessions</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
