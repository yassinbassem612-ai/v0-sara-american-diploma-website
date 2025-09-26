import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, Users, TrendingUp } from "lucide-react"

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Why Choose Sara American Diploma?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We provide comprehensive math education with proven results and personalized attention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-8">
              <CheckCircle className="h-16 w-16 text-accent mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-foreground mb-4">Proven Results</h3>
              <p className="text-muted-foreground">
                Our students consistently achieve higher scores and academic success.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-8">
              <Clock className="h-16 w-16 text-accent mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-foreground mb-4">Flexible Schedule</h3>
              <p className="text-muted-foreground">Study at your own pace with flexible scheduling options.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-8">
              <Users className="h-16 w-16 text-accent mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-foreground mb-4">Expert Instructors</h3>
              <p className="text-muted-foreground">Learn from experienced educators with proven teaching methods.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-8">
              <TrendingUp className="h-16 w-16 text-accent mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-foreground mb-4">Track Progress</h3>
              <p className="text-muted-foreground">Monitor your improvement with detailed progress tracking.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
