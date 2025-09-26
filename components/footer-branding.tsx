"use client"

import { MessageCircle } from "lucide-react"

export function FooterBranding() {
  const handleClick = () => {
    window.open("https://wa.me/201033110143", "_blank")
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleClick}
        className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 text-sm font-medium"
      >
        <MessageCircle className="h-4 w-4" />
        <span>Made by Yassin Bassem</span>
      </button>
    </div>
  )
}
