import { Card, CardContent } from "@/components/ui/card"

export function StudentAchievements() {
  const achievements = [
    {
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-03-27%20at%204.31.47%20PM-3k2c7JQd2sEoa4ULbPBmLqWMcCUVXk.jpeg",
      mathScore: "770",
      description: "SAT March 2026 - Total Score: 1380",
    },
    {
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-03-27%20at%204.31.47%20PM%20%283%29-573VUpBOre13b83d2aC2ySOiiAUL2w.jpeg",
      mathScore: "780",
      description: "SAT December 2025 - Total Score: 1340",
    },
    {
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-03-27%20at%204.31.46%20PM-n0oQYCqQyZTGYoKLNW2a4TejrTVZzs.jpeg",
      mathScore: "700",
      description: "SAT March 2026 - Improved 540 points!",
    },
    {
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-03-27%20at%204.31.47%20PM%20%282%29-pzGonoiN8OqoddMPGBvwbv31VDF5yc.jpeg",
      mathScore: "770",
      description: "SAT December 2025 - Total Score: 1490",
    },
    {
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-03-27%20at%204.31.47%20PM%20%281%29-MU7CQWbAyLaCdq9HoSs56fv4xlgs1G.jpeg",
      mathScore: "710",
      description: "SAT December 2025 - Total Score: 1270",
    },
  ]

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Students Achievements</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See the outstanding results our students have achieved in their standardized tests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {achievements.map((achievement, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-0">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={achievement.image || "/placeholder.svg"}
                    alt={`Student achievement ${index + 1}`}
                    className="w-full h-full object-contain bg-gray-50"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Math Score: {achievement.mathScore}</h3>
                  <p className="text-muted-foreground">{achievement.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
