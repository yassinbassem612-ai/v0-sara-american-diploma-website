import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, MapPin, MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

async function getContactInfo() {
  const supabase = createClient()
  const { data, error } = await supabase.from("home_content").select("phone_number, center_location").limit(1)

  if (error) {
    console.error("Error fetching contact info:", error)
    return null
  }

  return data && data.length > 0 ? data[0] : null
}

export async function ContactSection() {
  const contactInfo = await getContactInfo()

  const phoneNumber = contactInfo?.phone_number || "01020176774"
  const whatsappUrl = `https://wa.me/201020176774`

  return (
    <section id="contact" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Contact Information</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get in touch with us for more information about our math tutoring programs.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Phone</h3>
                    <p className="text-muted-foreground">{phoneNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Location</h3>
                    <p className="text-muted-foreground">
                      {contactInfo?.center_location || "Zayed-rawdet zayed/ dokki-center enovation"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button
              asChild
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-300"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Contact Us on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
