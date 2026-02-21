import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "@/components/Login-form"
import LoginAnimatedTile4x3 from "@/components/LoginAnimatedTile4x3"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-black">
      {/* Left side - Animated Tiles (changed: lg:w-1/2 → lg:w-[55%], added overflow-hidden) */}
      <div className="hidden lg:flex lg:w-[55%] overflow-hidden">
        <LoginAnimatedTile4x3 />
      </div>

      {/* Right side - Login Form (changed: lg:w-1/2 → lg:w-[45%]) */}
      <div className="flex w-full lg:w-[45%] items-center justify-center p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <a href="#" className="flex items-center gap-2 self-center font-medium text-white">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Ad OS
          </a>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
