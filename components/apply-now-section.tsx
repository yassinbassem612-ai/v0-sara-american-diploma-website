"use client"

import { Button } from "@/components/ui/button"
import { ExternalLink, GraduationCap, Calendar } from "lucide-react"

export function ApplyNowSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600 rounded-full">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Apply Now for Next Course
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Don't miss your chance to join our next American Diploma program. Secure your spot today and take the first
            step towards your academic success.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
              <span className="font-medium">Limited Seats Available</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <GraduationCap className="h-5 w-5" />
              <span className="font-medium">{""}</span>
            </div>
          </div>

          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            onClick={() => window.open("https://forms.gle/J6jvtoG4QcUt5z5C9", "_blank")}
          >
            Apply Now
            <ExternalLink className="ml-2 h-5 w-5" />
          </Button>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Application takes only 5 minutes to complete</p>
        </div>
      </div>
    </section>
  )
}
