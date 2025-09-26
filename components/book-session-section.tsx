import { Button } from "@/components/ui/button"
import { Calendar, ExternalLink } from "lucide-react"

export function BookSessionSection() {
  return (
    <section className="py-20 bg-accent/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <Calendar className="h-16 w-16 text-accent mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">Book Free Session</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Ready to start your journey to academic success? Book a free consultation session with Sara and discover how
            we can help you achieve your goals.
          </p>
          <Button size="lg" className="text-lg px-8 py-6 bg-accent hover:bg-accent/90" asChild>
            <a
              href="https://forms.gle/8DZ6TaTAg9qNNmex5"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              Book Your Free Session
              <ExternalLink className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
