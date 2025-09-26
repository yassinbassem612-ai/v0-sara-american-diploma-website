import { GraduationCap } from "lucide-react"

export function HomeFooter() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground">Sara American Diploma</span>
            </div>
            <p className="text-muted-foreground">
              Empowering students to achieve their academic dreams through expert math education and test preparation.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Test Preparation</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>SAT Math</li>
              <li>ACT Math</li>
              <li>EST Preparation</li>
              <li>{""}</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a href="#about" className="hover:text-foreground transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-foreground transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="/sign-in" className="hover:text-foreground transition-colors">
                  Student Portal
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 Sara American Diploma. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
