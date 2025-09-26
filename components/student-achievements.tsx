import { Card, CardContent } from "@/components/ui/card"

export function StudentAchievements() {
  const achievements = [
    {
      image: "/images/achievement-1.jpeg",
      mathScore: "580",
      description: "SAT Math Score: 580",
    },
    {
      image: "/images/achievement-2.jpeg",
      mathScore: "550",
      description: "EST Mathematics Score: 550",
    },
    {
      image: "/images/achievement-3.jpeg",
      mathScore: "520",
      description: "SAT Math Score: 520",
    },
    {
      image: "/images/achievement-4.jpeg",
      mathScore: "640",
      description: "EST Mathematics Score: 640",
    },
    {
      image: "/images/achievement-5.jpeg",
      mathScore: "510",
      description: "SAT Math Score: 510",
    },
    {
      image: "/images/achievement-6.jpeg",
      mathScore: "610",
      description: "Mathematics Score: 610",
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
